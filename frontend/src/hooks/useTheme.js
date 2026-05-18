import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleDarkMode, setDarkMode } from '../store/slices/uiSlice';

const useTheme = () => {
  const dispatch = useDispatch();
  const darkMode = useSelector((state) => state.ui.darkMode);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggle = () => dispatch(toggleDarkMode());
  const setMode = (mode) => dispatch(setDarkMode(mode));

  return { darkMode, toggle, setMode };
};

export default useTheme;
