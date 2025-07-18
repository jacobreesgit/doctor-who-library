/**
 * User Features Hook
 * 
 * Custom hook for managing user favorites and watch history
 */

import { useState, useEffect } from 'react'
import { supabase, type UserFavorite, type UserWatchHistory } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export const useUserFeatures = () => {
  const { user } = useAuth()
  const [favorites, setFavorites] = useState<UserFavorite[]>([])
  const [watchHistory, setWatchHistory] = useState<UserWatchHistory[]>([])
  const [loading, setLoading] = useState(false)

  // Load user favorites
  useEffect(() => {
    if (user) {
      loadFavorites()
      loadWatchHistory()
    } else {
      setFavorites([])
      setWatchHistory([])
    }
  }, [user])

  const loadFavorites = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setFavorites(data || [])
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWatchHistory = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_watch_history')
        .select('*')
        .eq('user_id', user.id)
        .order('watched_at', { ascending: false })
        .limit(100) // Limit to recent 100 items
      
      if (error) throw error
      setWatchHistory(data || [])
    } catch (error) {
      console.error('Error loading watch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToFavorites = async (libraryItemId: string) => {
    if (!user) return false
    
    try {
      const { error } = await supabase
        .from('user_favorites')
        .insert({
          user_id: user.id,
          library_item_id: libraryItemId
        })
      
      if (error) throw error
      
      // Refresh favorites
      await loadFavorites()
      return true
    } catch (error) {
      console.error('Error adding to favorites:', error)
      return false
    }
  }

  const removeFromFavorites = async (libraryItemId: string) => {
    if (!user) return false
    
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('library_item_id', libraryItemId)
      
      if (error) throw error
      
      // Refresh favorites
      await loadFavorites()
      return true
    } catch (error) {
      console.error('Error removing from favorites:', error)
      return false
    }
  }

  const addToWatchHistory = async (libraryItemId: string, progress?: number) => {
    if (!user) return false
    
    try {
      // Check if already exists, update if so
      const { data: existing } = await supabase
        .from('user_watch_history')
        .select('id')
        .eq('user_id', user.id)
        .eq('library_item_id', libraryItemId)
        .single()
      
      if (existing) {
        // Update existing entry
        const { error } = await supabase
          .from('user_watch_history')
          .update({
            watched_at: new Date().toISOString(),
            progress: progress || 100
          })
          .eq('id', existing.id)
        
        if (error) throw error
      } else {
        // Insert new entry
        const { error } = await supabase
          .from('user_watch_history')
          .insert({
            user_id: user.id,
            library_item_id: libraryItemId,
            watched_at: new Date().toISOString(),
            progress: progress || 100
          })
        
        if (error) throw error
      }
      
      // Refresh watch history
      await loadWatchHistory()
      return true
    } catch (error) {
      console.error('Error adding to watch history:', error)
      return false
    }
  }

  const isFavorite = (libraryItemId: string) => {
    return favorites.some(fav => fav.library_item_id === libraryItemId)
  }

  const isWatched = (libraryItemId: string) => {
    return watchHistory.some(history => history.library_item_id === libraryItemId)
  }

  const getWatchProgress = (libraryItemId: string) => {
    const history = watchHistory.find(h => h.library_item_id === libraryItemId)
    return history?.progress || 0
  }

  return {
    favorites,
    watchHistory,
    loading,
    addToFavorites,
    removeFromFavorites,
    addToWatchHistory,
    isFavorite,
    isWatched,
    getWatchProgress,
    refreshFavorites: loadFavorites,
    refreshWatchHistory: loadWatchHistory
  }
}