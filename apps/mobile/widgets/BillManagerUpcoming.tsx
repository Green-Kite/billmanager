import { HStack, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
  privacySensitive,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';

import type { BillManagerWidgetSnapshot } from '../src/native/widgetSnapshot';

function BillManagerUpcoming(
  props: BillManagerWidgetSnapshot,
  environment: WidgetEnvironment,
) {
  'widget';

  const compact = environment.widgetFamily === 'systemSmall';
  const destination = props.billId == null
    ? 'billmanager://home'
    : `billmanager://bills/${props.billId}`;

  return (
    <VStack
      alignment="leading"
      spacing={compact ? 6 : 8}
      modifiers={[
        padding({ all: compact ? 14 : 16 }),
        containerBackground('#F7FBF8', 'widget'),
        widgetURL(destination),
      ]}
    >
      <HStack>
        <Text modifiers={[font({ textStyle: 'caption', weight: 'semibold' }), foregroundStyle('#00875A')]}>
          BILLMANAGER
        </Text>
        <Spacer />
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle('#65736D')]}>{props.nextUpLabel}</Text>
      </HStack>
      <Spacer />
      <Text modifiers={[font({ textStyle: compact ? 'headline' : 'title3', weight: 'bold' })]}>
        {props.title}
      </Text>
      <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle('#65736D')]}>
        {props.dueLabel}
      </Text>
      {props.showAmounts ? (
        <Text modifiers={[font({ textStyle: compact ? 'title3' : 'title2', weight: 'bold' }), foregroundStyle('#00875A'), privacySensitive()]}>
          {props.amountLabel}
        </Text>
      ) : null}
      {!compact && props.showAmounts ? (
        <Text modifiers={[font({ textStyle: 'caption' }), foregroundStyle('#65736D'), privacySensitive()]}>
          {props.remainingThisMonthLabel}
        </Text>
      ) : null}
    </VStack>
  );
}

export default createWidget('BillManagerUpcoming', BillManagerUpcoming);
