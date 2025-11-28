import { useEffect, useState } from 'react';
import { AppBar, Toolbar, Button, Box, Avatar, Menu, MenuItem, IconButton, Tooltip } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/firebase';
import { getUserByUid } from '../firebase/usersApi';
import { logoutUser } from '../firebase/api';
import HomeIcon from '@mui/icons-material/Home';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SchoolIcon from '@mui/icons-material/School';
import FolderIcon from '@mui/icons-material/Folder';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';

export default function Navbar() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [anchorElUser, setAnchorElUser] = useState<null | HTMLElement>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      setUserEmail(user?.email || null);
      if (user?.uid) {
        // טען את התפקיד של המשתמש מפיירסטור כדי לדעת אם הוא אדמין
        getUserByUid(user.uid)
          .then((u) => setIsAdmin(u?.role === 'admin'))
          .catch(() => setIsAdmin(false));
      } else {
        setIsAdmin(false);
      }
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

  const handleOpenUserMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorElUser(event.currentTarget);
  };

  const handleCloseUserMenu = () => {
    setAnchorElUser(null);
  };

  const handleProfile = () => {
    handleCloseUserMenu();
    navigate('/profile');
  };

  const avatarLetter = userEmail ? userEmail.charAt(0).toUpperCase() : '?';

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
            onClick={() => handleNavigation('/video-courses')}
            startIcon={<AddCircleOutlineIcon />}
            sx={{ gap: 1 }}
            style={{ display: isAdmin ? 'inline-flex' : 'none' }}
          >
            קורסי וידאו +
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleNavigation('/video-courses/view')}
            startIcon={<PlayCircleOutlineIcon />}
            sx={{ gap: 1 }}
          >
            צפייה בקורסי וידאו
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
        {isAuthenticated ? (
          <Box sx={{ flexGrow: 0 }}>
            <Tooltip title="פרופיל">
              <IconButton onClick={handleOpenUserMenu} sx={{ p: 0 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  {avatarLetter}
                </Avatar>
              </IconButton>
            </Tooltip>
            <Menu
              sx={{ mt: '45px' }}
              anchorEl={anchorElUser}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorElUser)}
              onClose={handleCloseUserMenu}
            >
              <MenuItem onClick={handleProfile}>
                פרופיל
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                התנתק
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button 
            color="inherit" 
            onClick={() => navigate('/login')}
            startIcon={<LoginIcon />}
            sx={{ gap: 1 }}
          >
            התחבר
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

