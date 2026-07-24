export interface UserDto {
  id: string;
  username: string;
  email: string;
  role: "USER" | "ADMIN";
  beerCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminOverviewDto {
  users: UserDto[];
  logs: PageDto<BeerLogDto>;
}

export interface UpdateBeerLogInput {
  userId: string;
  beerTypeId: string;
  quantity: number;
  createdAt: string;
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

export type EventStatus = "UPCOMING" | "ACTIVE" | "FINISHED";

export interface EventSummaryDto {
  id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: EventStatus;
  isCreator: boolean;
  inviteCode: string | null;
  memberCount: number;
  totalBeers: number;
}

export interface EventTimelinePointDto {
  key: string;
  label: string;
  startsAt: string;
  endsAt: string;
}

export interface EventTimelineSeriesDto {
  key: string;
  label: string;
  userId: string;
  values: number[];
  total: number;
}

export interface EventTimelineDto {
  bucketMinutes: number;
  points: EventTimelinePointDto[];
  series: EventTimelineSeriesDto[];
}

export interface EventBeverageTotalDto {
  key: string;
  beerTypeId: string | null;
  name: string;
  photoDataUrl: string | null;
  total: number;
  percentage: number;
}

export interface EventParticipantBreakdownDto {
  userId: string;
  username: string;
  total: number;
  values: number[];
}

export interface EventDashboardDto {
  event: EventSummaryDto;
  ranking: RankingEntryDto[];
  hourlyConsumption: StatisticCountDto[];
  timeline: EventTimelineDto;
  beverageTotals: EventBeverageTotalDto[];
  participantBreakdown: EventParticipantBreakdownDto[];
  recentLogs: PageDto<BeerLogDto>;
  filteredTotal: number;
  selectedBeerTypeId: string | null;
  selectedBeerTypeIds: string[];
  timeZone: string;
  generatedAt: string;
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
