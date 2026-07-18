export interface UserDto {
  id: string;
  username: string;
  email: string;
  beerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface RankingEntryDto {
  position: number;
  userId: string;
  username: string;
  beerCount: number;
}

export interface BeerTypeDto {
  id: string;
  name: string;
  photoDataUrl: string;
  createdAt: string;
}

export interface BeerLogDto {
  id: string;
  userId: string;
  username: string;
  actionType: "BEER_ADDED";
  quantity: number;
  beerType: BeerTypeDto | null;
  createdAt: string;
}

export interface BeerAddedDto {
  beerCount: number;
  log: BeerLogDto;
}

export interface PageDto<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ApiErrorDto {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  fieldErrors?: Record<string, string[]>;
}
