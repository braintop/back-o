import { collection, addDoc, query, where, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';
import { db } from './firebase';

export interface GameScore {
  id?: string;
  username: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  gameType: string;
  createdAt: Timestamp;
  duration: number; // in seconds
}

// Collection name
const GAMES_COLLECTION = 'gameScores';

// Save a game score
export async function saveGameScore(gameScore: Omit<GameScore, 'id' | 'createdAt'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, GAMES_COLLECTION), {
      ...gameScore,
      createdAt: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving game score:', error);
    throw error;
  }
}

// Get top 10 scores for a specific game type
export async function getTopScores(gameType: string, limitCount: number = 10): Promise<GameScore[]> {
  try {
    const q = query(
      collection(db, GAMES_COLLECTION),
      where('gameType', '==', gameType),
      orderBy('score', 'desc'),
      limit(limitCount)
    );
    
    const querySnapshot = await getDocs(q);
    const scores: GameScore[] = [];
    
    querySnapshot.forEach((doc) => {
      scores.push({
        id: doc.id,
        ...doc.data() as Omit<GameScore, 'id'>
      });
    });
    
    return scores;
  } catch (error) {
    console.error('Error getting top scores:', error);
    throw error;
  }
}

// Get user's game history
export async function getUserGameHistory(username: string, gameType?: string): Promise<GameScore[]> {
  try {
    let q;
    if (gameType) {
      q = query(
        collection(db, GAMES_COLLECTION),
        where('username', '==', username),
        where('gameType', '==', gameType),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    } else {
      q = query(
        collection(db, GAMES_COLLECTION),
        where('username', '==', username),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }
    
    const querySnapshot = await getDocs(q);
    const history: GameScore[] = [];
    
    querySnapshot.forEach((doc) => {
      history.push({
        id: doc.id,
        ...doc.data() as Omit<GameScore, 'id'>
      });
    });
    
    return history;
  } catch (error) {
    console.error('Error getting user game history:', error);
    throw error;
  }
}

// Get user's best score for a game type
export async function getUserBestScore(username: string, gameType: string): Promise<GameScore | null> {
  try {
    const q = query(
      collection(db, GAMES_COLLECTION),
      where('username', '==', username),
      where('gameType', '==', gameType),
      orderBy('score', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data() as Omit<GameScore, 'id'>
    };
  } catch (error) {
    console.error('Error getting user best score:', error);
    throw error;
  }
}
