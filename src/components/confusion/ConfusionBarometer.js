import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox } from 'semantic-ui-react'
import { defineMessages, FormattedMessage, intlShape } from 'react-intl'
import { compose, withProps, lifecycle } from 'recompose'
import _sumBy from 'lodash/sumBy'
import dayjs from 'dayjs'

import ConfusionSection from './ConfusionSection'

const messages = defineMessages({
  activated: {
    defaultMessage: 'Activated',
    id: 'common.string.activated',
  },
  difficultyRange: {
    defaultMessage: 'easy - hard',
    id: 'runningSession.confusion.difficulty.Range',
  },
  difficultyTitle: {
    defaultMessage: 'Difficulty',
    id: 'runningSession.confusion.difficulty.Title',
  },
  speedRange: {
    defaultMessage: 'slow - fast',
    id: 'runningSession.confusion.speed.Range',
  },
  speedTitle: {
    defaultMessage: 'Speed',
    id: 'runningSession.confusion.speed.Title',
  },
})

const propTypes = {
  confusionTS: PropTypes.arrayOf(
    PropTypes.shape({
      createdAt: PropTypes.string.isRequired,
      difficulty: PropTypes.number.isRequired,
      speed: PropTypes.number.isRequired,
    })
  ),
  handleActiveToggle: PropTypes.func.isRequired,
  intl: intlShape.isRequired,
  isActive: PropTypes.bool,
}

const defaultProps = {
  confusionTS: [],
  isActive: false,
}

const ConfusionBarometer = ({ confusionTS, intl, isActive, handleActiveToggle }) => (
  <div className="confusionBarometer">
    <h2>
      <FormattedMessage defaultMessage="Confusion-Barometer" id="runningSession.confusion.title" />
    </h2>

    <Checkbox
      toggle
      defaultChecked={isActive}
      label={intl.formatMessage(messages.activated)}
      value={isActive}
      onChange={handleActiveToggle}
    />

    {(() => {
      if (isActive) {
        return (
          <>
            <ConfusionSection
              data={confusionTS.map(({ timestamp, difficulty, difficultyRunning }) => ({
                timestamp,
                value: difficulty,
                valueRunning: difficultyRunning,
              }))}
              title={intl.formatMessage(messages.difficultyTitle)}
              ylabel={intl.formatMessage(messages.difficultyRange)}
            />
            <ConfusionSection
              data={confusionTS.map(({ timestamp, speed, speedRunning }) => ({
                timestamp,
                value: speed,
                valueRunning: speedRunning,
              }))}
              title={intl.formatMessage(messages.speedTitle)}
              ylabel={intl.formatMessage(messages.speedRange)}
            />
          </>
        )
      }

      return null
    })()}

    <style jsx>
      {`
        @import 'src/theme';

        .confusionBarometer {
          display: flex;
          flex-direction: column;

          h2 {
            margin-bottom: 1rem;
          }

          h3 {
            margin: 0 0 0.5rem 0;
          }

          :global(.checkbox) {
            margin-bottom: 1rem;
          }

          .confusionSection {
            flex: 1;

            background: lightgrey;
            border: 1px solid grey;
            margin-top: 1rem;
            padding: 1rem;

            @include desktop-tablet-only {
              padding: 0.5rem;

              &:last-child {
                margin-top: 0.5rem;
              }
            }
          }
        }
      `}
    </style>
  </div>
)

ConfusionBarometer.propTypes = propTypes
ConfusionBarometer.defaultProps = defaultProps

export default compose(
  lifecycle({
    componentDidMount() {
      this.props.subscribeToMore()
    },
  }),
  withProps(({ confusionTS }) => ({
    confusionTS: confusionTS.reduce((acc, { createdAt, speed, difficulty }) => {
      const tempAcc = [...acc, { difficulty, speed }]

      // calculate the running average for difficulty and speed
      const difficultyRunning = _sumBy(tempAcc, 'difficulty') / tempAcc.length
      const speedRunning = _sumBy(tempAcc, 'speed') / tempAcc.length

      return [
        ...acc,
        {
          difficulty,
          difficultyRunning,
          speed,
          speedRunning,
          timestamp: dayjs(createdAt).format('H:mm:ss'),
        },
      ]
    }, []),
  }))
)(ConfusionBarometer)
