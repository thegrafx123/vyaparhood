import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import React, { useState } from 'react';
import { Modal, Platform, Pressable, View } from 'react-native';
import { colors } from '../theme/tokens';
import { digitsOnly } from '../utils/validation';
import { CtaButton } from './Buttons';
import { Field } from './Form';
import { BottomSheet } from './Sheet';

/** "DD / MM / YYYY" -> Date (local calendar day), or null if incomplete. */
const toDate = (v: string) => {
  const d = digitsOnly(v);
  if (d.length !== 8) return null;
  const date = new Date(Number(d.slice(4, 8)), Number(d.slice(2, 4)) - 1, Number(d.slice(0, 2)));
  return isNaN(date.getTime()) ? null : date;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toText = (d: Date) => `${pad(d.getDate())} / ${pad(d.getMonth() + 1)} / ${d.getFullYear()}`;

type Props = Omit<React.ComponentProps<typeof Field>, 'value' | 'onChange' | 'onChangeText' | 'editable'> & {
  /** "DD / MM / YYYY", or '' before a date is picked. */
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
};

/**
 * Looks exactly like a Field, but tapping it opens the phone's own date
 * picker: the calendar dialog on Android, a date wheel in a bottom sheet
 * on iOS. Opens on the current value, else on `maximumDate`.
 */
export function DateField({ value, onChange, minimumDate, maximumDate, label, boxStyle, ...field }: Props) {
  // iOS only: the date on the wheel while the sheet is open.
  const [iosDate, setIosDate] = useState<Date | null>(null);

  const open = () => {
    const initial = toDate(value) ?? maximumDate ?? new Date();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        minimumDate,
        maximumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(toText(date));
        },
      });
    } else {
      setIosDate(initial);
    }
  };

  return (
    <>
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityValue={{ text: value || 'Not set' }}
      >
        <View pointerEvents="none">
          <Field
            {...field}
            label={label}
            value={value}
            editable={false}
            boxStyle={[iosDate && !field.error ? { borderColor: colors.blue } : null, boxStyle]}
          />
        </View>
      </Pressable>

      {Platform.OS === 'ios' && (
        <Modal visible={!!iosDate} transparent animationType="none" onRequestClose={() => setIosDate(null)}>
          <BottomSheet onDismiss={() => setIosDate(null)}>
            {iosDate && (
              <DateTimePicker
                value={iosDate}
                mode="date"
                display="spinner"
                minimumDate={minimumDate}
                maximumDate={maximumDate}
                themeVariant="light"
                textColor={colors.ink}
                onChange={(_, d) => d && setIosDate(d)}
              />
            )}
            <CtaButton
              label="Done"
              icon="check"
              onPress={() => {
                if (iosDate) onChange(toText(iosDate));
                setIosDate(null);
              }}
            />
          </BottomSheet>
        </Modal>
      )}
    </>
  );
}
