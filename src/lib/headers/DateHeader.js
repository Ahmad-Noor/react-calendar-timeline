import React from 'react'
import PropTypes from 'prop-types'
import { TimelineStateConsumer } from '../timeline/TimelineStateContext'
import CustomHeader from './CustomHeader'
import { getNextUnit } from '../utility/calendar'
import { defaultHeaderFormats } from '../default-config'
import Interval from './Interval'
import memoize from 'memoize-one'

class DateHeader extends React.Component {
  static propTypes = {
    unit: PropTypes.string,
    style: PropTypes.object,
    className: PropTypes.string,
    timelineUnit: PropTypes.string,
    labelFormat: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
      PropTypes.string
    ]).isRequired,
    intervalRenderer: PropTypes.func,
    headerData: PropTypes.object,
    height: PropTypes.number
  }

  getHeaderUnit = () => {
    if (this.props.unit === 'primaryHeader') {
      return getNextUnit(this.props.timelineUnit)
    } else if (this.props.unit) {
      return this.props.unit
    }
    return this.props.timelineUnit
  }

  getRootStyle = memoize(style => {
    return {
      height: 30,
      ...style
    }
  })

  getLabelFormat = (interval, unit, labelWidth) => {
    const { labelFormat } = this.props
    if (typeof labelFormat === 'string') {
      const startTime = interval[0]
      return startTime.format(labelFormat)
    } else if (typeof labelFormat === 'function') {
      return labelFormat(interval, unit, labelWidth)
    } else {
      throw new Error('labelFormat should be function or string')
    }
  }

  getHeaderData = memoize(
    (
      intervalRenderer,
      style,
      className,
      getLabelFormat,
      unitProp,
      headerData
    ) => {
      return {
        intervalRenderer,
        style,
        className,
        getLabelFormat,
        unitProp,
        headerData
      }
    }
  )

  render() {
    const unit = this.getHeaderUnit()
    const { headerData, height } = this.props
    return (
      <CustomHeader
        unit={unit}
        height={height}
        headerData={this.getHeaderData(
          this.props.intervalRenderer,
          this.getRootStyle(this.props.style),
          this.props.className,
          this.getLabelFormat,
          this.props.unit,
          this.props.headerData
        )}
        children={Header}
      />
    )
  }
}

class DateHeaderWrapper extends React.Component {
  static propTypes = {
    style: PropTypes.object,
    className: PropTypes.string,
    unit: PropTypes.string,
    labelFormat: PropTypes.oneOfType([
      PropTypes.func,
      PropTypes.objectOf(PropTypes.objectOf(PropTypes.string)),
      PropTypes.string
    ]),
    intervalRenderer: PropTypes.func,
    headerData: PropTypes.object,
    height: PropTypes.number
  }

  static defaultProps = {
    labelFormat: formatLabel
  }

  render() {
    const {
      unit,
      labelFormat,
      style,
      className,
      intervalRenderer,
      headerData,
      height
    } = this.props
    return (
      <TimelineStateConsumer>
        {({ getTimelineState }) => {
          const timelineState = getTimelineState()
          return (
            <DateHeader
              timelineUnit={timelineState.timelineUnit}
              unit={unit}
              labelFormat={labelFormat}
              style={style}
              className={className}
              intervalRenderer={intervalRenderer}
              headerData={headerData}
              height={height}
            />
          )
        }}
      </TimelineStateConsumer>
    )
  }
}

function Header({
  headerContext: { intervals, unit },
  getRootProps,
  getIntervalProps,
  showPeriod,
  data: {
    style,
    intervalRenderer,
    className,
    getLabelFormat,
    unitProp,
    ...restData
  }
}) {
  return (
    <div
      data-testid={`dateHeader`}
      className={className}
      {...getRootProps({ style })}
    >
      {intervals.map(interval => {
        const intervalText = getLabelFormat(
          [interval.startTime, interval.endTime],
          unit,
          interval.labelWidth
        )
        return (
          <Interval
            key={`label-${interval.startTime.valueOf()}`}
            unit={unit}
            interval={interval}
            showPeriod={showPeriod}
            intervalText={intervalText}
            primaryHeader={unitProp === 'primaryHeader'}
            getIntervalProps={getIntervalProps}
            intervalRenderer={intervalRenderer}
            headerData={restData}
          />
        )
      })}
    </div>
  )
}

function formatLabel(
  [timeStart, timeEnd],
  unit,
  labelWidth,
  formatOptions = defaultHeaderFormats
) {
  let format
  if (labelWidth >= 150) {
    format = formatOptions[unit]['long']
  } else if (labelWidth >= 100) {
    format = formatOptions[unit]['mediumLong']
  } else if (labelWidth >= 50) {
    format = formatOptions[unit]['medium']
  } else {
    format = formatOptions[unit]['short']
  }
  return timeStart.format(format)
}

export default DateHeaderWrapper
