import { Box } from '@mui/material';
import { styled } from '@mui/material/styles';

// Using consistent badge styles from the app (matching MetadataBadge)
export const StyledResolutionButton = styled('button')<{
  quality: 'high' | 'medium' | 'low';
  hasDropdown?: boolean;
}>(({ theme, quality, hasDropdown }) => ({
  fontSize: '0.75rem',
  fontWeight: 500,
  minWidth: hasDropdown ? '75px' : '40px',
  height: '22px',
  padding: '2px 8px',
  textAlign: 'center',
  cursor: hasDropdown ? 'pointer' : 'default',
  border: 'none',
  borderRadius: theme.shape.borderRadius, // Use theme border radius
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: theme.spacing(0.5),
  transition: 'all 0.2s ease',
  letterSpacing: '0.02em',

  // Color scheme matching theme
  backgroundColor:
    quality === 'high'
      ? theme.palette.success.light
      : quality === 'medium'
        ? theme.palette.warning.light
        : theme.palette.error.light,
  color:
    quality === 'high'
      ? theme.palette.success.contrastText
      : quality === 'medium'
        ? theme.palette.warning.contrastText
        : theme.palette.error.contrastText,

  '&:hover': {
    backgroundColor: hasDropdown
      ? quality === 'high'
        ? theme.palette.success.main
        : quality === 'medium'
          ? theme.palette.warning.main
          : theme.palette.error.main
      : undefined,
    transform: hasDropdown ? 'translateY(-1px)' : undefined,
  },

  '&:active': {
    transform: hasDropdown ? 'translateY(0)' : undefined,
  },
}));

export const StyledResolutionText = styled('span')({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  flex: 1,
});

// Simplified variant item without quality icons for cleaner look
export const StyledVariantItem = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  paddingLeft: theme.spacing(0.5),

  '& .MuiListItemText-primary': {
    fontSize: '0.8rem',
    lineHeight: 1.2,
  },
}));
