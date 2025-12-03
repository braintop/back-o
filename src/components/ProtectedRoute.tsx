import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedEmails?: string[];
}

export default function ProtectedRoute({ children, allowedEmails }: ProtectedRouteProps) {
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setIsAuthenticated(!!user);
            setUserEmail(user?.email ?? null);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (allowedEmails && (!userEmail || !allowedEmails.includes(userEmail))) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
}

