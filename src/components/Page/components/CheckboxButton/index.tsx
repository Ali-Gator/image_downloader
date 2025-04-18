import { CheckboxButtonProps } from '@types';

import { StyledCheckbox } from './styles';

export const CheckboxButton = ({
  checked,
  onChange,
  readOnly = false,
  className = 'image-checkbox',
}: CheckboxButtonProps) => {
  return (
    <StyledCheckbox
      checked={checked}
      onChange={onChange}
      readOnly={readOnly}
      className={className}
    />
  );
};
