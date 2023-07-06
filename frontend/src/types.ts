export interface ExtendedSelectDisplayProps extends React.HTMLAttributes<HTMLDivElement> {
  'data-test'?: string
}

export enum MarketPlaceModelSelectType {
  MY_MODELS = 'My Models',
  FAVOURITES = 'Favourites',
}

export enum MarketPlaceModelGroup {
  MY_MODELS = 'user',
  FAVOURITES = 'favourites',
  ALL = 'all',
}
