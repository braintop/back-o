import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { logoutUser } from '../firebase/api';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import FolderIcon from '@mui/icons-material/Folder';

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = (path: string) => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(path);
    }
  };

  return (
    <AppBar position="static" dir="rtl">
      <Toolbar sx={{ direction: 'rtl' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/')}
            startIcon={<HomeIcon />}
            sx={{ gap: 1 }}
          >
            בית
          </Button>
          {!isAuthenticated && (
            <Button 
              color="inherit" 
              onClick={() => navigate('/register')}
              startIcon={<PersonAddIcon />}
              sx={{ gap: 1 }}
            >
              הרשמה
            </Button>
          )}
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/courses')}
            startIcon={<SchoolIcon />}
            sx={{ gap: 1 }}
          >
            קורסים
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/shared-files')}
            startIcon={<FolderIcon />}
            sx={{ gap: 1 }}
          >
            קבצי שיעור
          </Button>
        </Box>
        <Button 
          color="inherit" 
          onClick={isAuthenticated ? handleLogout : () => navigate('/login')}
          startIcon={isAuthenticated ? <LogoutIcon /> : <LoginIcon />}
          sx={{ gap: 1 }}
        >
          {isAuthenticated ? 'התנתק' : 'התחבר'}
        </Button>
      </Toolbar>
    </AppBar>
  );
}

