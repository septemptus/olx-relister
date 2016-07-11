import moment from 'moment';
import constants from 'constants';

const CLASSES = constants.CLASSES;
const FORMATS = constants.FORMATS;

function flash(isError) {
    let className = isError ? CLASSES.ERROR : CLASSES.SUCCESS;

    document.body.classList.add(className);

    setTimeout(() => {
        document.body.classList.remove(className);
    }, 500);
}

function createHour(hour) {
    if (!hour) {
        return '';
    }

    return moment().hour(hour.hour).minute(hour.minute).format(FORMATS.HOUR_FORMAT);
}

export default {
    createHour: createHour,
    flash: flash
};