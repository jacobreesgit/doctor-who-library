#!/usr/bin/env python3
"""
Script to analyze the Doctor Who Library database structure and content.
"""

import sqlite3
import json
from pathlib import Path
from collections import Counter
from datetime import datetime

def analyze_database():
    """Analyze the Doctor Who Library database."""
    
    db_path = Path("doctor_who_library.db")
    if not db_path.exists():
        print(f"❌ Database file not found at {db_path}")
        return
    
    print(f"🔍 Analyzing database at {db_path}")
    print("=" * 80)
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # 1. Check if database exists and has tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [row[0] for row in cursor.fetchall()]
        
        print(f"📊 Database Tables Found: {len(tables)}")
        for table in tables:
            print(f"  - {table}")
        print()
        
        if not tables:
            print("❌ No tables found in database")
            return
        
        # 2. Examine library_items table structure
        if 'library_items' in tables:
            print("📋 Library Items Table Schema:")
            cursor.execute("PRAGMA table_info(library_items);")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]}) {'NOT NULL' if col[3] else 'NULL'}")
            print()
            
            # 3. Count total items
            cursor.execute("SELECT COUNT(*) FROM library_items;")
            total_items = cursor.fetchone()[0]
            print(f"📚 Total Library Items: {total_items}")
            
            if total_items > 0:
                # 4. Analyze content types
                print("\n🎭 Content Types:")
                cursor.execute("SELECT content_type, COUNT(*) FROM library_items GROUP BY content_type ORDER BY COUNT(*) DESC;")
                content_types = cursor.fetchall()
                for content_type, count in content_types:
                    print(f"  - {content_type or 'Unknown'}: {count}")
                
                # 5. Analyze sections
                print("\n📚 Sections:")
                cursor.execute("SELECT section_name, COUNT(*) FROM library_items GROUP BY section_name ORDER BY COUNT(*) DESC;")
                sections = cursor.fetchall()
                for section, count in sections:
                    print(f"  - {section or 'Unknown'}: {count}")
                
                # 6. Analyze groups
                print("\n📖 Groups (Top 20):")
                cursor.execute("SELECT group_name, COUNT(*) FROM library_items GROUP BY group_name ORDER BY COUNT(*) DESC LIMIT 20;")
                groups = cursor.fetchall()
                for group, count in groups:
                    print(f"  - {group or 'Unknown'}: {count}")
                
                # 7. Analyze enrichment status
                print("\n🔍 Enrichment Status:")
                cursor.execute("SELECT enrichment_status, COUNT(*) FROM library_items GROUP BY enrichment_status ORDER BY COUNT(*) DESC;")
                enrichment_status = cursor.fetchall()
                for status, count in enrichment_status:
                    print(f"  - {status or 'Unknown'}: {count}")
                
                # 8. Analyze doctors
                print("\n👨‍⚕️ Doctors:")
                cursor.execute("SELECT doctor, COUNT(*) FROM library_items WHERE doctor IS NOT NULL GROUP BY doctor ORDER BY COUNT(*) DESC;")
                doctors = cursor.fetchall()
                for doctor, count in doctors:
                    print(f"  - {doctor}: {count}")
                
                # 9. Sample data analysis
                print("\n📋 Sample Records (First 5):")
                cursor.execute("""
                    SELECT 
                        title, 
                        content_type, 
                        section_name, 
                        group_name, 
                        doctor, 
                        enrichment_status,
                        wiki_url
                    FROM library_items 
                    LIMIT 5
                """)
                samples = cursor.fetchall()
                for i, sample in enumerate(samples, 1):
                    print(f"  {i}. Title: {sample[0]}")
                    print(f"     Content Type: {sample[1]}")
                    print(f"     Section: {sample[2]}")
                    print(f"     Group: {sample[3]}")
                    print(f"     Doctor: {sample[4]}")
                    print(f"     Enrichment: {sample[5]}")
                    print(f"     Wiki URL: {sample[6]}")
                    print()
                
                # 10. Date analysis
                print("📅 Date Analysis:")
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE broadcast_date IS NOT NULL;")
                broadcast_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE release_date IS NOT NULL;")
                release_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE cover_date IS NOT NULL;")
                cover_count = cursor.fetchone()[0]
                
                print(f"  - Items with broadcast_date: {broadcast_count}")
                print(f"  - Items with release_date: {release_count}")
                print(f"  - Items with cover_date: {cover_count}")
                
                # 11. Enrichment data availability
                print("\n🔍 Enrichment Data Availability:")
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE wiki_url IS NOT NULL;")
                wiki_url_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE wiki_summary IS NOT NULL;")
                wiki_summary_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE wiki_image_url IS NOT NULL;")
                wiki_image_count = cursor.fetchone()[0]
                cursor.execute("SELECT COUNT(*) FROM library_items WHERE cast_info IS NOT NULL;")
                cast_info_count = cursor.fetchone()[0]
                
                print(f"  - Items with wiki_url: {wiki_url_count}")
                print(f"  - Items with wiki_summary: {wiki_summary_count}")
                print(f"  - Items with wiki_image_url: {wiki_image_count}")
                print(f"  - Items with cast_info: {cast_info_count}")
        
        # 12. Check other tables
        if 'library_sections' in tables:
            print("\n📚 Library Sections:")
            cursor.execute("SELECT name, display_name, description FROM library_sections ORDER BY sort_order;")
            sections_data = cursor.fetchall()
            for section in sections_data:
                print(f"  - {section[0]} ({section[1]}): {section[2]}")
        
        if 'library_groups' in tables:
            print("\n📖 Library Groups:")
            cursor.execute("SELECT name, section_name FROM library_groups ORDER BY section_name, sort_order;")
            groups_data = cursor.fetchall()
            for group in groups_data:
                print(f"  - {group[0]} (Section: {group[1]})")
        
        # 13. Data quality analysis
        print("\n🔍 Data Quality Analysis:")
        cursor.execute("SELECT COUNT(*) FROM library_items WHERE title IS NULL OR title = '';")
        missing_titles = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM library_items WHERE content_type IS NULL OR content_type = '';")
        missing_content_types = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM library_items WHERE section_name IS NULL OR section_name = '';")
        missing_sections = cursor.fetchone()[0]
        
        print(f"  - Items missing title: {missing_titles}")
        print(f"  - Items missing content_type: {missing_content_types}")
        print(f"  - Items missing section_name: {missing_sections}")
        
        print("\n✅ Database analysis complete!")
        
    except sqlite3.Error as e:
        print(f"❌ Database error: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        if conn:
            conn.close()

if __name__ == "__main__":
    analyze_database()