import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  freeCredits: number;
  subscriptionStatus: 'free' | 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'lifetime';
  isLifetime?: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  planExpiresAt?: string;
  usage: {
    assessmentsGenerated: number;
    correctionsMade: number;
    lastResetDate: string;
  };
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, profile: null, loading: true });

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to profile changes
        const unsubProfile = onSnapshot(userRef, async (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            
            // Auto-upgrade creator to admin with lifetime credits
            if (currentUser.email === 'gilmaralvesmf@gmail.com' && (data.role !== 'admin' || data.subscriptionStatus !== 'lifetime' || !data.isLifetime)) {
              try {
                await updateDoc(userRef, {
                  role: 'admin',
                  subscriptionStatus: 'lifetime',
                  isLifetime: true,
                  freeCredits: 999999999,
                  planExpiresAt: null
                });
                return; // The snapshot listener will trigger again
              } catch (error) {
                console.error("Error upgrading creator to admin:", error);
              }
            }

            // Check if usage needs to be reset (e.g., 30 days passed since lastResetDate)
            if (data.subscriptionStatus !== 'free' && data.usage?.lastResetDate) {
              const lastReset = new Date(data.usage.lastResetDate);
              const now = new Date();
              const diffTime = Math.abs(now.getTime() - lastReset.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
              
              if (diffDays >= 30) {
                // Reset usage
                try {
                  await updateDoc(userRef, {
                    'usage.assessmentsGenerated': 0,
                    'usage.correctionsMade': 0,
                    'usage.lastResetDate': now.toISOString()
                  });
                  // The snapshot listener will trigger again with the updated data
                  return; 
                } catch (error) {
                  console.error("Error resetting usage:", error);
                }
              }
            }
            
            // Check if plan expired
            if (data.subscriptionStatus !== 'free' && data.planExpiresAt) {
              const expiresAt = new Date(data.planExpiresAt);
              const now = new Date();
              if (now > expiresAt) {
                try {
                  await updateDoc(userRef, {
                    subscriptionStatus: 'free',
                    planExpiresAt: null
                  });
                  return;
                } catch (error) {
                  console.error("Error expiring plan:", error);
                }
              }
            }

            setProfile(data);
          } else {
            // Create new user profile
            const isAdmin = currentUser.email === 'gilmaralvesmf@gmail.com';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || '',
              photoURL: currentUser.photoURL || '',
              freeCredits: isAdmin ? 999999999 : 3,
              subscriptionStatus: isAdmin ? 'lifetime' : 'free',
              isLifetime: isAdmin,
              role: isAdmin ? 'admin' : 'user',
              createdAt: new Date().toISOString(),
              usage: {
                assessmentsGenerated: 0,
                correctionsMade: 0,
                lastResetDate: new Date().toISOString(),
              }
            };
            await setDoc(userRef, newProfile);
            setProfile(newProfile);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
        
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
