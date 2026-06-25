import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type RootTabParamList = {
  Notifications: undefined;
};

export type RootTabScreenProps<T extends keyof RootTabParamList> =
  BottomTabScreenProps<RootTabParamList, T>;

declare module '@react-navigation/native' {
  interface RootParamList extends RootTabParamList {}
}
