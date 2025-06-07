import { memoize } from "@fxts/core"
import { ofetch } from "ofetch"

export const getVideoInfo = memoize(async (videoId: string) => {
  const r = await ofetch<Response>(
    `https://www.youtube.com/youtubei/v1/player`,
    {
      method: "POST",
      body: {
        context: {
          client: {
            clientName: "WEB",
            clientVersion: "2.20241205.05.00",
          },
        },
        videoId,
      },
    },
  )

  return r
})

interface Response {
  responseContext: ResponseContext
  playabilityStatus: PlayabilityStatus
  streamingData: StreamingData
  playbackTracking: PlaybackTracking
  captions: Captions
  videoDetails: VideoDetails
  annotations: Annotation[]
  playerConfig: PlayerConfig
  storyboards: Storyboards
  microformat: Microformat
  cards: Cards
  trackingParams: string
  videoQualityPromoSupportedRenderers: VideoQualityPromoSupportedRenderers
  messages: Message[]
  adPlacements: AdPlacement[]
  adBreakHeartbeatParams: string
  frameworkUpdates: FrameworkUpdates
}

interface AdPlacement {
  adPlacementRenderer: AdPlacementRenderer
}

interface AdPlacementRenderer {
  config: Config
  renderer: Renderer
  adSlotLoggingData: AdSlotLoggingData
}

interface AdSlotLoggingData {
  serializedSlotAdServingDataEntry: string
}

interface Config {
  adPlacementConfig: AdPlacementConfig
}

interface AdPlacementConfig {
  kind: string
  adTimeOffset: AdTimeOffset
  hideCueRangeMarker: boolean
}

interface AdTimeOffset {
  offsetStartMilliseconds: string
  offsetEndMilliseconds: string
}

interface Renderer {
  clientForecastingAdRenderer: ClientForecastingAdRenderer
}

type ClientForecastingAdRenderer = {}

interface Annotation {
  playerAnnotationsExpandedRenderer: PlayerAnnotationsExpandedRenderer
}

interface PlayerAnnotationsExpandedRenderer {
  featuredChannel: FeaturedChannel
  allowSwipeDismiss: boolean
  annotationId: string
}

interface FeaturedChannel {
  startTimeMs: string
  endTimeMs: string
  watermark: IconClass
  trackingParams: string
  navigationEndpoint: NavigationEndpoint
  channelName: string
  subscribeButton: SubscribeButton
}

interface NavigationEndpoint {
  clickTrackingParams: string
  commandMetadata: NavigationEndpointCommandMetadata
  browseEndpoint: NavigationEndpointBrowseEndpoint
}

interface NavigationEndpointBrowseEndpoint {
  browseId: string
}

interface NavigationEndpointCommandMetadata {
  webCommandMetadata: PurpleWebCommandMetadata
}

interface PurpleWebCommandMetadata {
  url?: string
  webPageType?: string
  rootVe?: number
  apiUrl?: string
  sendPost?: boolean
}

interface SubscribeButton {
  subscribeButtonRenderer: SubscribeButtonRenderer
}

interface SubscribeButtonRenderer {
  buttonText: MessageTitle
  subscribed: boolean
  enabled: boolean
  type: string
  channelId: string
  showPreferences: boolean
  subscribedButtonText: MessageTitle
  unsubscribedButtonText: MessageTitle
  trackingParams: string
  unsubscribeButtonText: MessageTitle
  serviceEndpoints: ServiceEndpoint[]
  subscribeAccessibility: SubscribeAccessibility
  unsubscribeAccessibility: SubscribeAccessibility
  signInEndpoint: SignInEndpoint
}

interface MessageTitle {
  runs: MessageTitleRun[]
}

interface MessageTitleRun {
  text: string
}

interface ServiceEndpoint {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  subscribeEndpoint?: SubscribeEndpoint
  signalServiceEndpoint?: SignalServiceEndpoint
}

interface ServiceEndpointCommandMetadata {
  webCommandMetadata: FluffyWebCommandMetadata
}

interface FluffyWebCommandMetadata {
  sendPost: boolean
  apiUrl?: string
}

interface SignalServiceEndpoint {
  signal: string
  actions: SignalServiceEndpointAction[]
}

interface SignalServiceEndpointAction {
  clickTrackingParams: string
  openPopupAction: OpenPopupAction
}

interface OpenPopupAction {
  popup: Popup
  popupType: string
}

interface Popup {
  confirmDialogRenderer: ConfirmDialogRenderer
}

interface ConfirmDialogRenderer {
  trackingParams: string
  dialogMessages: MessageTitle[]
  confirmButton: Button
  cancelButton: Button
  primaryIsCancel: boolean
}

interface Button {
  buttonRenderer: CancelButtonButtonRenderer
}

interface CancelButtonButtonRenderer {
  style: string
  size: string
  isDisabled: boolean
  text: MessageTitle
  accessibility: Accessibility
  trackingParams: string
  serviceEndpoint?: UnsubscribeCommand
}

interface Accessibility {
  label: string
}

interface UnsubscribeCommand {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  unsubscribeEndpoint: SubscribeEndpoint
}

interface SubscribeEndpoint {
  channelIds: string[]
  params: string
}

interface SignInEndpoint {
  clickTrackingParams: string
  commandMetadata: SignInEndpointCommandMetadata
}

interface SignInEndpointCommandMetadata {
  webCommandMetadata: TentacledWebCommandMetadata
}

interface TentacledWebCommandMetadata {
  url: string
}

interface SubscribeAccessibility {
  accessibilityData: Accessibility
}

interface IconClass {
  thumbnails: ThumbnailElement[]
}

interface ThumbnailElement {
  url: string
  width: number
  height: number
}

interface Captions {
  playerCaptionsTracklistRenderer: PlayerCaptionsTracklistRenderer
}

interface PlayerCaptionsTracklistRenderer {
  captionTracks: CaptionTrack[]
  audioTracks: AudioTrack[]
  translationLanguages: TranslationLanguage[]
  defaultAudioTrackIndex: number
}

interface AudioTrack {
  captionTrackIndices: number[]
}

interface CaptionTrack {
  baseUrl: string
  name: HeaderText
  vssId: string
  languageCode: string
  kind: string
  isTranslatable: boolean
  trackName: string
}

interface HeaderText {
  simpleText: string
}

interface TranslationLanguage {
  languageCode: string
  languageName: HeaderText
}

interface Cards {
  cardCollectionRenderer: CardCollectionRenderer
}

interface CardCollectionRenderer {
  cards: Card[]
  headerText: HeaderText
  icon: CloseButton
  closeButton: CloseButton
  trackingParams: string
  allowTeaserDismiss: boolean
  logIconVisibilityUpdates: boolean
}

interface Card {
  cardRenderer: CardRenderer
}

interface CardRenderer {
  teaser: Teaser
  cueRanges: CueRange[]
  trackingParams: string
}

interface CueRange {
  startCardActiveMs: string
  endCardActiveMs: string
  teaserDurationMs: string
  iconAfterTeaserMs: string
}

interface Teaser {
  simpleCardTeaserRenderer: SimpleCardTeaserRenderer
}

interface SimpleCardTeaserRenderer {
  message: HeaderText
  trackingParams: string
  prominent: boolean
  logVisibilityUpdates: boolean
  onTapCommand: OnTapCommand
}

interface OnTapCommand {
  clickTrackingParams: string
  changeEngagementPanelVisibilityAction: ChangeEngagementPanelVisibilityAction
}

interface ChangeEngagementPanelVisibilityAction {
  targetId: string
  visibility: string
}

interface CloseButton {
  infoCardIconRenderer: InfoCardIconRenderer
}

interface InfoCardIconRenderer {
  trackingParams: string
}

interface FrameworkUpdates {
  entityBatchUpdate: EntityBatchUpdate
}

interface EntityBatchUpdate {
  mutations: Mutation[]
  timestamp: Timestamp
}

interface Mutation {
  entityKey: string
  type: string
  payload: Payload
}

interface Payload {
  offlineabilityEntity: OfflineabilityEntity
}

interface OfflineabilityEntity {
  key: string
  addToOfflineButtonState: string
}

interface Timestamp {
  seconds: string
  nanos: number
}

interface Message {
  mealbarPromoRenderer: MealbarPromoRenderer
}

interface MealbarPromoRenderer {
  icon: IconClass
  messageTexts: MessageTitle[]
  actionButton: MealbarPromoRendererActionButton
  dismissButton: DismissButton
  triggerCondition: string
  style: string
  trackingParams: string
  impressionEndpoints: ImpressionEndpoint[]
  isVisible: boolean
  messageTitle: MessageTitle
  supplementalText: MessageTitle
}

interface MealbarPromoRendererActionButton {
  buttonRenderer: PurpleButtonRenderer
}

interface PurpleButtonRenderer {
  style: string
  size: string
  text: MessageTitle
  trackingParams: string
  command: PurpleCommand
}

interface PurpleCommand {
  clickTrackingParams: string
  commandExecutorCommand: PurpleCommandExecutorCommand
}

interface PurpleCommandExecutorCommand {
  commands: CommandElement[]
}

interface CommandElement {
  clickTrackingParams?: string
  commandMetadata: NavigationEndpointCommandMetadata
  browseEndpoint?: CommandBrowseEndpoint
  feedbackEndpoint?: FeedbackEndpoint
}

interface CommandBrowseEndpoint {
  browseId: string
  params: string
}

interface FeedbackEndpoint {
  feedbackToken: string
  uiActions: UIActions
}

interface UIActions {
  hideEnclosingContainer: boolean
}

interface DismissButton {
  buttonRenderer: DismissButtonButtonRenderer
}

interface DismissButtonButtonRenderer {
  style: string
  size: string
  text: MessageTitle
  trackingParams: string
  command: FluffyCommand
}

interface FluffyCommand {
  clickTrackingParams: string
  commandExecutorCommand: FluffyCommandExecutorCommand
}

interface FluffyCommandExecutorCommand {
  commands: ImpressionEndpoint[]
}

interface ImpressionEndpoint {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  feedbackEndpoint: FeedbackEndpoint
}

interface Microformat {
  playerMicroformatRenderer: PlayerMicroformatRenderer
}

interface PlayerMicroformatRenderer {
  thumbnail: IconClass
  embed: Embed
  title: HeaderText
  description: HeaderText
  lengthSeconds: string
  ownerProfileUrl: string
  externalChannelId: string
  isFamilySafe: boolean
  availableCountries: string[]
  isUnlisted: boolean
  hasYpcMetadata: boolean
  viewCount: string
  category: string
  publishDate: Date
  ownerChannelName: string
  uploadDate: Date
  isShortsEligible: boolean
  externalVideoId: string
  likeCount: string
  canonicalUrl: string
}

interface Embed {
  iframeUrl: string
  width: number
  height: number
}

interface PlayabilityStatus {
  status: string
  playableInEmbed: boolean
  miniplayer: Miniplayer
  contextParams: string
}

interface Miniplayer {
  miniplayerRenderer: MiniplayerRenderer
}

interface MiniplayerRenderer {
  playbackMode: string
}

interface PlaybackTracking {
  videostatsPlaybackUrl: PtrackingURLClass
  videostatsDelayplayUrl: PtrackingURLClass
  videostatsWatchtimeUrl: PtrackingURLClass
  ptrackingUrl: PtrackingURLClass
  qoeUrl: PtrackingURLClass
  atrUrl: AtrURLClass
  videostatsScheduledFlushWalltimeSeconds: number[]
  videostatsDefaultFlushIntervalSeconds: number
  youtubeRemarketingUrl: AtrURLClass
}

interface AtrURLClass {
  baseUrl: string
  elapsedMediaTimeSeconds: number
}

interface PtrackingURLClass {
  baseUrl: string
}

interface PlayerConfig {
  audioConfig: AudioConfig
  streamSelectionConfig: StreamSelectionConfig
  mediaCommonConfig: MediaCommonConfig
  webPlayerConfig: WebPlayerConfig
}

interface AudioConfig {
  loudnessDb: number
  perceptualLoudnessDb: number
  enablePerFormatLoudness: boolean
}

interface MediaCommonConfig {
  dynamicReadaheadConfig: DynamicReadaheadConfig
  mediaUstreamerRequestConfig: MediaUstreamerRequestConfig
  useServerDrivenAbr: boolean
  serverPlaybackStartConfig: ServerPlaybackStartConfig
  fixLivePlaybackModelDefaultPosition: boolean
}

interface DynamicReadaheadConfig {
  maxReadAheadMediaTimeMs: number
  minReadAheadMediaTimeMs: number
  readAheadGrowthRateMs: number
}

interface MediaUstreamerRequestConfig {
  videoPlaybackUstreamerConfig: string
}

interface ServerPlaybackStartConfig {
  enable: boolean
  playbackStartPolicy: PlaybackStartPolicy
}

interface PlaybackStartPolicy {
  startMinReadaheadPolicy: StartMinReadaheadPolicy[]
}

interface StartMinReadaheadPolicy {
  minReadaheadMs: number
}

interface StreamSelectionConfig {
  maxBitrate: string
}

interface WebPlayerConfig {
  useCobaltTvosDash: boolean
  webPlayerActionsPorting: WebPlayerActionsPorting
}

interface WebPlayerActionsPorting {
  getSharePanelCommand: GetSharePanelCommand
  subscribeCommand: SubscribeCommand
  unsubscribeCommand: UnsubscribeCommand
  addToWatchLaterCommand: AddToWatchLaterCommand
  removeFromWatchLaterCommand: RemoveFromWatchLaterCommand
}

interface AddToWatchLaterCommand {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  playlistEditEndpoint: AddToWatchLaterCommandPlaylistEditEndpoint
}

interface AddToWatchLaterCommandPlaylistEditEndpoint {
  playlistId: string
  actions: PurpleAction[]
}

interface PurpleAction {
  addedVideoId: string
  action: string
}

interface GetSharePanelCommand {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  webPlayerShareEntityServiceEndpoint: WebPlayerShareEntityServiceEndpoint
}

interface WebPlayerShareEntityServiceEndpoint {
  serializedShareEntity: string
}

interface RemoveFromWatchLaterCommand {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  playlistEditEndpoint: RemoveFromWatchLaterCommandPlaylistEditEndpoint
}

interface RemoveFromWatchLaterCommandPlaylistEditEndpoint {
  playlistId: string
  actions: FluffyAction[]
}

interface FluffyAction {
  action: string
  removedVideoId: string
}

interface SubscribeCommand {
  clickTrackingParams: string
  commandMetadata: ServiceEndpointCommandMetadata
  subscribeEndpoint: SubscribeEndpoint
}

interface ResponseContext {
  visitorData: string
  serviceTrackingParams: ServiceTrackingParam[]
  maxAgeSeconds: number
  mainAppWebResponseContext: MainAppWebResponseContext
  webResponseContextExtensionData: WebResponseContextExtensionData
}

interface MainAppWebResponseContext {
  loggedOut: boolean
  trackingParam: string
}

interface ServiceTrackingParam {
  service: string
  params: Param[]
}

interface Param {
  key: string
  value: string
}

interface WebResponseContextExtensionData {
  hasDecorated: boolean
}

interface Storyboards {
  playerStoryboardSpecRenderer: PlayerStoryboardSpecRenderer
}

interface PlayerStoryboardSpecRenderer {
  spec: string
  recommendedLevel: number
  highResolutionRecommendedLevel: number
}

interface StreamingData {
  expiresInSeconds: string
  formats: Format[]
  adaptiveFormats: AdaptiveFormat[]
  serverAbrStreamingUrl: string
}

interface AdaptiveFormat {
  itag: number
  mimeType: string
  bitrate: number
  width?: number
  height?: number
  initRange: Range
  indexRange: Range
  lastModified: string
  contentLength: string
  quality: string
  fps?: number
  qualityLabel?: string
  projectionType: ProjectionType
  averageBitrate: number
  approxDurationMs: string
  qualityOrdinal: string
  colorInfo?: ColorInfo
  highReplication?: boolean
  audioQuality?: string
  audioSampleRate?: string
  audioChannels?: number
  loudnessDb?: number
  xtags?: string
  isDrc?: boolean
}

interface ColorInfo {
  primaries: Primaries
  transferCharacteristics: TransferCharacteristics
  matrixCoefficients: MatrixCoefficients
}

enum MatrixCoefficients {
  ColorMatrixCoefficientsBt709 = "COLOR_MATRIX_COEFFICIENTS_BT709",
}

enum Primaries {
  ColorPrimariesBt709 = "COLOR_PRIMARIES_BT709",
}

enum TransferCharacteristics {
  ColorTransferCharacteristicsBt709 = "COLOR_TRANSFER_CHARACTERISTICS_BT709",
}

interface Range {
  start: string
  end: string
}

enum ProjectionType {
  Rectangular = "RECTANGULAR",
}

interface Format {
  itag: number
  url: string
  mimeType: string
  bitrate: number
  width: number
  height: number
  lastModified: string
  contentLength: string
  quality: string
  fps: number
  qualityLabel: string
  projectionType: ProjectionType
  averageBitrate: number
  audioQuality: string
  approxDurationMs: string
  audioSampleRate: string
  audioChannels: number
  qualityOrdinal: string
}

interface VideoDetails {
  videoId: string
  title: string
  lengthSeconds: string
  keywords: string[]
  channelId: string
  isOwnerViewing: boolean
  shortDescription: string
  isCrawlable: boolean
  thumbnail: IconClass
  allowRatings: boolean
  viewCount: string
  author: string
  isPrivate: boolean
  isUnpluggedCorpus: boolean
  isLiveContent: boolean
}

interface VideoQualityPromoSupportedRenderers {
  videoQualityPromoRenderer: VideoQualityPromoRenderer
}

interface VideoQualityPromoRenderer {
  triggerCriteria: TriggerCriteria
  text: Text
  endpoint: Endpoint
  trackingParams: string
  snackbar: Snackbar
}

interface Endpoint {
  clickTrackingParams: string
  commandMetadata: NavigationEndpointCommandMetadata
  urlEndpoint: URLEndpoint
}

interface URLEndpoint {
  url: string
  target: string
}

interface Snackbar {
  notificationActionRenderer: NotificationActionRenderer
}

interface NotificationActionRenderer {
  responseText: MessageTitle
  actionButton: NotificationActionRendererActionButton
  trackingParams: string
}

interface NotificationActionRendererActionButton {
  buttonRenderer: FluffyButtonRenderer
}

interface FluffyButtonRenderer {
  text: MessageTitle
  navigationEndpoint: Endpoint
  trackingParams: string
}

interface Text {
  runs: PurpleRun[]
}

interface PurpleRun {
  text: string
  bold?: boolean
}

interface TriggerCriteria {
  connectionWhitelist: string[]
  joinLatencySeconds: number
  rebufferTimeSeconds: number
  watchTimeWindowSeconds: number
  refractorySeconds: number
}
