import type {
  DataChangedScope,
  IChartApi,
  ISeriesApi,
  ISeriesPrimitive,
  SeriesAttachedParameter,
  SeriesOptionsMap,
  Time,
} from "lightweight-charts";

export abstract class PluginBase implements ISeriesPrimitive<Time> {
  private _chart: IChartApi | undefined;
  private _series: ISeriesApi<keyof SeriesOptionsMap> | undefined;
  private _requestUpdate?: () => void;

  protected dataUpdated?(scope: DataChangedScope): void;

  protected requestUpdate(): void {
    this._requestUpdate?.();
  }

  attached({ chart, series, requestUpdate }: SeriesAttachedParameter<Time>) {
    this._chart = chart;
    this._series = series;
    this._series.subscribeDataChanged(this._fireDataUpdated);
    this._requestUpdate = requestUpdate;
    this.requestUpdate();
  }

  detached() {
    this._series?.unsubscribeDataChanged(this._fireDataUpdated);
    this._chart = undefined;
    this._series = undefined;
    this._requestUpdate = undefined;
  }

  get chart(): IChartApi {
    if (!this._chart) throw new Error("Plugin not attached");
    return this._chart;
  }

  get series(): ISeriesApi<keyof SeriesOptionsMap> {
    if (!this._series) throw new Error("Plugin not attached");
    return this._series;
  }

  private _fireDataUpdated = (scope: DataChangedScope) => {
    this.dataUpdated?.(scope);
  };
}
