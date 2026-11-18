import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/src/components/ui/select';
import type { SharePermission } from '@/src/types';

interface PermissionSelectorProps {
  value: SharePermission;
  onChange: (value: SharePermission) => void;
  allowOwner?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PermissionSelector({
  value,
  onChange,
  allowOwner = false,
  disabled = false,
  className,
}: PermissionSelectorProps) {
  return (
    <Select
      value={value}
      onValueChange={(val) => onChange(val as SharePermission)}
      disabled={disabled}
    >
      <SelectTrigger className={className || 'w-32'}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="viewer">Can view</SelectItem>
        <SelectItem value="editor">Can edit</SelectItem>
        {allowOwner ? <SelectItem value="owner">Owner</SelectItem> : null}
      </SelectContent>
    </Select>
  );
}
