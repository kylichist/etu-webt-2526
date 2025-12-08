import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const Navigation: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { path: '/brokers', label: 'Брокеры' },
    { path: '/stocks', label: 'Акции' },
    { path: '/trading', label: 'Торги' },
  ];

  return (
    <AppBar position="static">
      <Toolbar>
        <ShowChartIcon sx={{ mr: 2 }} />
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Биржа Брокеров
        </Typography>

        {isMobile ? (
          <>
            <IconButton
              size="large"
              edge="end"
              color="inherit"
              aria-label="menu"
              onClick={handleMenuOpen}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              {navItems.map((item) => (
                <MenuItem
                  key={item.path}
                  component={Link}
                  to={item.path}
                  onClick={handleMenuClose}
                  selected={location.pathname === item.path}
                >
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        ) : (
          <Box>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                color="inherit"
                sx={{
                  ml: 2,
                  fontWeight: location.pathname === item.path ? 'bold' : 'normal',
                }}
              >
                {item.label}
              </Button>
            ))}
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
