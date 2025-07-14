#!/usr/bin/env python3
"""
Complete Episode Scraper
Scrapes ALL episodes from the complete story links
Based on the simple episode scraper but processes all 357+ stories
"""

import json
import time
import re
import os
import requests
from pathlib import Path
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options

class CompleteEpisodeScraper:
    def __init__(self, headless=True, base_dir="episodes"):
        self.driver = None
        self.headless = headless
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)
        
        # Setup requests session for image downloads
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        })
        
        # Load story links
        self.story_links = self.load_story_links()
        
    def load_story_links(self):
        """Load story links from complete_story_links.json"""
        links_file = Path("complete_story_links.json")
        if not links_file.exists():
            raise FileNotFoundError("complete_story_links.json not found. Run get_all_story_links.py first.")
        
        with open(links_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return data.get('stories', [])
        
    def setup_driver(self):
        """Setup Chrome driver"""
        chrome_options = Options()
        if self.headless:
            chrome_options.add_argument("--headless")
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--window-size=1920,1080")
        
        self.driver = webdriver.Chrome(options=chrome_options)
        
    def sanitize_filename(self, name):
        """Convert episode name to safe folder/filename"""
        safe_name = re.sub(r'[<>:"/\\|?*]', '', name)
        safe_name = re.sub(r'[^\w\s-]', '', safe_name)
        safe_name = re.sub(r'[-\s]+', '-', safe_name)
        return safe_name.strip('-').lower()
    
    def download_image(self, url, filepath):
        """Download an image from URL to filepath"""
        try:
            response = self.session.get(url, timeout=30)
            if response.status_code == 200:
                with open(filepath, 'wb') as f:
                    f.write(response.content)
                return True
        except Exception as e:
            print(f"      Failed to download image: {e}")
        return False
    
    def scrape_episode_page(self, url, story_title):
        """Scrape a single episode page"""
        try:
            self.driver.get(url)
            time.sleep(2)  # Wait for page to load
            
            # Check page title
            page_title = self.driver.title
            if "Something went wrong" in page_title or "404" in page_title:
                print(f"      ❌ Error page for {story_title}")
                return None
            
            # Extract episode data
            episode_data = {
                "story_title": story_title,
                "url": url,
                "page_title": page_title,
                "hero_image_url": None,
                "synopsis": None,
                "scraped_at": time.strftime('%Y-%m-%d %H:%M:%S')
            }
            
            # Extract hero background image
            try:
                hero_elements = self.driver.find_elements(By.CSS_SELECTOR, '.content-hero__background-image')
                if hero_elements:
                    style = hero_elements[0].get_attribute('style')
                    if style and 'background-image' in style:
                        url_match = re.search(r'background-image:\s*url\(["\']([^"\']+)["\']\)', style)
                        if url_match:
                            episode_data["hero_image_url"] = url_match.group(1)
            except Exception as e:
                print(f"      Warning: Could not extract hero image - {e}")
            
            # Extract synopsis/description
            try:
                synopsis_selectors = [
                    '.large-hero-synopsis__synopsis',
                    '.synopsis',
                    '.story-synopsis', 
                    '[data-testid="synopsis"]',
                    '.episode-description',
                    '.story-description'
                ]
                
                for selector in synopsis_selectors:
                    elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    if elements and elements[0].text.strip():
                        episode_data["synopsis"] = elements[0].text.strip()
                        break
                        
            except Exception as e:
                print(f"      Warning: Could not extract synopsis - {e}")
            
            return episode_data
            
        except Exception as e:
            print(f"      ❌ Failed to scrape {story_title}: {e}")
            return None
    
    def save_episode_data(self, episode_data, episode_folder):
        """Save episode data and download images"""
        if not episode_data:
            return False
        
        # Create episode folder
        episode_folder.mkdir(exist_ok=True)
        
        # Save JSON data
        json_file = episode_folder / "episode_data.json"
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(episode_data, f, indent=2, ensure_ascii=False)
        
        # Download hero image if available
        images_downloaded = 0
        if episode_data.get("hero_image_url"):
            hero_url = episode_data["hero_image_url"]
            ext = 'jpg'
            if '.png' in hero_url:
                ext = 'png'
            elif '.webp' in hero_url:
                ext = 'webp'
            
            hero_filepath = episode_folder / f"hero_background.{ext}"
            if self.download_image(hero_url, hero_filepath):
                images_downloaded += 1
        
        return images_downloaded > 0
    
    def scrape_all_episodes(self):
        """Scrape all episodes from the story links"""
        print("=== COMPLETE EPISODE SCRAPER ===")
        print(f"Scraping {len(self.story_links)} episodes")
        print(f"Output directory: {self.base_dir}")
        print()
        
        # Setup driver
        self.setup_driver()
        
        successful_scrapes = 0
        failed_scrapes = 0
        skipped_scrapes = 0
        
        # Stats tracking
        stats = {
            "total_episodes": len(self.story_links),
            "successful": 0,
            "failed": 0,
            "skipped": 0,
            "hero_images_found": 0,
            "synopsis_found": 0,
            "started_at": time.strftime('%Y-%m-%d %H:%M:%S')
        }
        
        try:
            for i, story in enumerate(self.story_links, 1):
                story_name = story.get('name', 'Unknown')
                story_url = story.get('url', '')
                
                print(f"[{i}/{len(self.story_links)}] Scraping: {story_name}")
                
                # Create folder name
                folder_name = self.sanitize_filename(story_name)
                episode_folder = self.base_dir / folder_name
                
                # Skip if already exists (resume capability)
                json_file = episode_folder / "episode_data.json"
                if json_file.exists():
                    print(f"      ⏭️ Already exists, skipping")
                    skipped_scrapes += 1
                    stats["skipped"] += 1
                    continue
                
                # Scrape episode data
                episode_data = self.scrape_episode_page(story_url, story_name)
                
                if episode_data:
                    # Save data and download images
                    has_images = self.save_episode_data(episode_data, episode_folder)
                    
                    # Track stats
                    if episode_data.get("hero_image_url"):
                        stats["hero_images_found"] += 1
                    if episode_data.get("synopsis"):
                        stats["synopsis_found"] += 1
                    
                    issues = []
                    if not episode_data.get("hero_image_url"):
                        issues.append("⚠️ no hero image")
                    if not episode_data.get("synopsis"):
                        issues.append("⚠️ no synopsis")
                    
                    print(f"      ✅ Saved to: {folder_name}/")
                    if issues:
                        print(f"         Issues: {', '.join(issues)}")
                    
                    successful_scrapes += 1
                    stats["successful"] += 1
                else:
                    print(f"      ❌ Failed to scrape {story_name}")
                    failed_scrapes += 1
                    stats["failed"] += 1
                
                # Rate limiting - be nice to the server
                time.sleep(1)
                
                # Test mode: Stop after 5 episodes for validation
                if i >= 5:
                    print(f"\n🧪 TEST MODE: Stopping after 5 episodes for validation")
                    break
                
                # Progress update every 50 episodes
                if i % 50 == 0:
                    print(f"\n📈 Progress Update: {i}/{len(self.story_links)} completed")
                    print(f"   ✅ Successful: {successful_scrapes}")
                    print(f"   ❌ Failed: {failed_scrapes}")
                    print(f"   ⏭️ Skipped: {skipped_scrapes}")
                    print()
                
        finally:
            if self.driver:
                self.driver.quit()
        
        # Final stats
        stats["completed_at"] = time.strftime('%Y-%m-%d %H:%M:%S')
        
        print(f"\n=== SCRAPING COMPLETE ===")
        print(f"Total episodes: {len(self.story_links)}")
        print(f"✅ Successful: {successful_scrapes}")
        print(f"❌ Failed: {failed_scrapes}")  
        print(f"⏭️ Skipped: {skipped_scrapes}")
        print(f"🖼️ Hero images found: {stats['hero_images_found']}")
        print(f"📝 Synopsis found: {stats['synopsis_found']}")
        
        # Save scraping stats
        stats_file = self.base_dir / "scraping_stats.json"
        with open(stats_file, 'w', encoding='utf-8') as f:
            json.dump(stats, f, indent=2, ensure_ascii=False)
        
        print(f"\nStats saved to: {stats_file}")
        
        return stats

def main():
    scraper = CompleteEpisodeScraper()
    scraper.scrape_all_episodes()

if __name__ == "__main__":
    main()