export default {
    STRINGS: {
        NOT_PRESENT: '-',
        SETTINGS_LOAD_FAILED: 'Failed to load settings'
    },
    FORMATS: {
        DATE_FORMAT: 'DD.MM.YYYY HH:mm',
        HOUR_FORMAT: 'HH:mm'
    },
    REGEXPS: {
        HOUR: /(\d\d):(\d\d)/
    },
    EVENTS: {
        CYCLE_RUN: 'olx.run',
        CYCLE_END: 'olx.cycle-end',
        CYCLE_FAILED: 'olx.cycle-failed',
        LOGS_COPY: 'olx.copy-logs',
        LOGS_COPIED: 'olx.logs-copied',
        TIMER_START: 'olx.timer.start',
        TIMER_STOP: 'olx.timer.stop',
        TIMER_UPDATED: 'olx.timer-updated'
    },
    SELECTORS: {
        LABEL_FROM: '[name=labelFrom]',
        LABEL_TO: '[name=labelTo]',
        MARK_AS_READ: '[name=markAsRead]',
        REMOVE_FROM_INBOX: '[name=removeFromInbox]',
        FORCE: '[name=force]',
        LAST_SUCCESS: '#last-success',
        NEXT_CHECK: '#next-check',
        COPY_LOGS: '[name=logs]',
        CHECK_HOUR: '[name=checkHour]'
    },
    CLASSES: {
        SUCCESS: 'success',
        ERROR: 'error'
    }
};