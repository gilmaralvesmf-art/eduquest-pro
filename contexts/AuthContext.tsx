import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
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
    let unsubProfile: (() => void) | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      // Clean up previous profile listener if it exists
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid);
        
        // Listen to profile changes
        unsubProfile = onSnapshot(userRef, async (docSnap) => {
          try {
            if (docSnap.exists()) {
              const data = docSnap.data() as UserProfile;
              let needsUpdate = false;
              const updates: any = {};

              // Initialize missing fields for existing users
              if (!data.subscriptionStatus) {
                data.subscriptionStatus = 'free';
                updates.subscriptionStatus = 'free';
                needsUpdate = true;
              }
              if (data.freeCredits === undefined) {
                data.freeCredits = 3;
                updates.freeCredits = 3;
                needsUpdate = true;
              }
              if (!data.usage) {
                data.usage = {
                  assessmentsGenerated: 0,
                  correctionsMade: 0,
                  lastResetDate: new Date().toISOString()
                };
                updates.usage = data.usage;
                needsUpdate = true;
              }
              if (!data.role) {
                data.role = 'user';
                updates.role = 'user';
                needsUpdate = true;
              }
              if (!data.createdAt) {
                data.createdAt = new Date().toISOString();
                updates.createdAt = data.createdAt;
                needsUpdate = true;
              }

              // Auto-upgrade creator to admin with lifetime credits
              const isAdminEmail = currentUser.email === 'gilmaralvesmf@gmail.com' || 
                                 currentUser.email === 'igoraquinodepinho@gmail.com' ||
                                 currentUser.email === 'euprofgilmaralves@gmail.com';

              if (isAdminEmail && (data.role !== 'admin' || data.subscriptionStatus !== 'lifetime' || !data.isLifetime)) {
                updates.role = 'admin';
                updates.subscriptionStatus = 'lifetime';
                updates.isLifetime = true;
                updates.freeCredits = 999999999;
                updates.planExpiresAt = null;
                needsUpdate = true;
              }

              // Auto-upgrade igoraquinodepinho@gmail.com to annual
              if (currentUser.email === 'igoraquinodepinho@gmail.com' && data.subscriptionStatus !== 'annual') {
                const oneYearFromNow = new Date();
                oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
                updates.subscriptionStatus = 'annual';
                updates.planExpiresAt = oneYearFromNow.toISOString();
                updates.freeCredits = 999999;
                needsUpdate = true;
              }

              if (needsUpdate) {
                await updateDoc(userRef, updates);
                // The snapshot listener will trigger again
                return;
              }

              // Check if usage needs to be reset (e.g., 30 days passed since lastResetDate)
              if (data.subscriptionStatus !== 'free' && data.usage?.lastResetDate) {
                const lastReset = new Date(data.usage.lastResetDate);
                const now = new Date();
                const diffTime = Math.abs(now.getTime() - lastReset.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                
                if (diffDays >= 30) {
                  await updateDoc(userRef, {
                    'usage.assessmentsGenerated': 0,
                    'usage.correctionsMade': 0,
                    'usage.lastResetDate': now.toISOString()
                  });
                  return; 
                }
              }
              
              // Check if plan expired (except for admins)
              if (data.subscriptionStatus !== 'free' && data.planExpiresAt && data.role !== 'admin') {
                const expiresAt = new Date(data.planExpiresAt);
                const now = new Date();
                if (now > expiresAt) {
                  await updateDoc(userRef, {
                    subscriptionStatus: 'free',
                    planExpiresAt: null
                  });
                  return;
                }
              }

              // Special logic for Super Admins to ensure total unlimited access
              const isSuperAdminEmail = currentUser.email === 'gilmaralvesmf@gmail.com' || 
                                      currentUser.email === 'igoraquinodepinho@gmail.com' ||
                                      currentUser.email === 'euprofgilmaralves@gmail.com';
              if (isSuperAdminEmail && (data.role !== 'admin' || data.subscriptionStatus !== 'lifetime')) {
                const updatedAdminProfile = {
                  ...data,
                  role: 'admin',
                  subscriptionStatus: 'lifetime',
                  isLifetime: true,
                  freeCredits: 999999
                };
                await setDoc(userRef, updatedAdminProfile);
                setProfile(updatedAdminProfile as UserProfile);
              } else {
                setProfile(data);
              }
            } else {
              // Create new user profile
              const isAdmin = currentUser.email === 'gilmaralvesmf@gmail.com' || 
                            currentUser.email === 'igoraquinodepinho@gmail.com' ||
                            currentUser.email === 'euprofgilmaralves@gmail.com';
              const isAnnual = false; // Combined into isAdmin check
              
              // Check for pending subscription from Kiwify
              let pendingSub: any = null;
              if (currentUser.email) {
                try {
                  const pendingRef = doc(db, 'pending_subscriptions', currentUser.email);
                  const pendingSnap = await getDoc(pendingRef);
                  if (pendingSnap.exists()) {
                    pendingSub = pendingSnap.data();
                    // We don't delete here anymore, let the creation handle it or handle it after successful setDoc
                  }
                } catch (error) {
                  console.warn("Non-critical: Error checking pending subscription:", error);
                }
              }

              const oneYearFromNow = new Date();
              oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

              const newProfile: UserProfile = {
                uid: currentUser.uid,
                email: currentUser.email || '',
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
                freeCredits: isAdmin ? 999999 : (pendingSub ? 999999 : 3),
                subscriptionStatus: isAdmin ? 'lifetime' : (pendingSub ? pendingSub.plan : 'free'),
                isLifetime: isAdmin,
                role: isAdmin ? 'admin' : 'user',
                planExpiresAt: (pendingSub ? pendingSub.expiresAt : null),
                createdAt: new Date().toISOString(),
                usage: {
                  assessmentsGenerated: 0,
                  correctionsMade: 0,
                  lastResetDate: new Date().toISOString(),
                }
              };
              
              await setDoc(userRef, newProfile);
              
              // Clean up pending subscription after successful profile creation
              if (pendingSub && currentUser.email) {
                try {
                  const pendingRef = doc(db, 'pending_subscriptions', currentUser.email);
                  await deleteDoc(pendingRef);
                } catch (e) {
                  console.error("Error deleting pending subscription:", e);
                }
              }

              setProfile(newProfile);
            }
          } catch (err) {
            console.error("Error in profile listener logic:", err);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
      if (unsubProfile) unsubProfile();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
