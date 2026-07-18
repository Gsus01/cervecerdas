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

export interface StatisticCountDto {
  key: string;
  label: string;
  count: number;
}

export interface BeerTypeStatisticDto extends StatisticCountDto {
  beerTypeId: string | null;
  photoDataUrl: string | null;
  percentage: number;
}

export interface BeerStatisticsDto {
  totalBeers: number;
  activeDays: number;
  averagePerActiveDay: number;
  varietyCount: number;
  last7Days: number;
  previous7Days: number;
  recentTrendPercentage: number | null;
  favoriteType: BeerTypeStatisticDto | null;
  favoriteHour: StatisticCountDto | null;
  byType: BeerTypeStatisticDto[];
  byWeekday: StatisticCountDto[];
  byTimeRange: StatisticCountDto[];
  last14Days: StatisticCountDto[];
  timeZone: string;
  generatedAt: string;
}

export interface CompetitionUserDto {
  position: number;
  userId: string;
  username: string;
  totalBeers: number;
  last7Days: number;
  previous7Days: number;
  trendPercentage: number | null;
  dailyLast7: StatisticCountDto[];
}

export interface CompetitionBattleDto {
  firstUserId: string;
  firstUsername: string;
  firstCount: number;
  secondUserId: string;
  secondUsername: string;
  secondCount: number;
  difference: number;
}

export interface GroupCompetitionDto {
  totalBeers: number;
  last7Days: number;
  activeUsers: number;
  users: CompetitionUserDto[];
  leader: CompetitionUserDto | null;
  closestBattle: CompetitionBattleDto | null;
  dailyTotals: StatisticCountDto[];
  timeZone: string;
  generatedAt: string;
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
