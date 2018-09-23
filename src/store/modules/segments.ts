const state = {
    elements: [
        {
            // Name of the Segment
            name: '1st Split',
            // Personal Best time in ms
            personalBest: 1000,
            // Best Segment/Overall time in ms
            overallBest: 750
        },
        {
            name: '2nd Split'
        },
        {
            name: '3rd Split'
        },
        {
            name: '4th Split'
        },
        {
            name: '5th Split'
        },
        {
            name: '6th Split'
        },
        {
            name: '7h Split'
        },
        {
            name: 'final Split'
        }
    ]
};

const mutations = {
    clearSegments(state) {
        state.elements = [];
        return true;
    },
    removeSegment(state, index) {
        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < 0 ||
            state.elements.length < index
        ) {
            return false;
        }
        state.elements.splice(index, 1);
        return true;
    },
    addSegment(state, segment) {
        if (segment == null || typeof segment !== 'object') {
            return false;
        }
        if (!segment.hasOwnProperty('name')) {
            return false;
        }
        state.elements.push(segment);
        return true;
    },
    updateSegment(state, data) {
        if (data == null || typeof data !== 'object') {
            return false;
        }
        const index = data.index;
        const segment = data.segment || null;

        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < 0 ||
            state.elements.length < index
        ) {
            return false;
        }
        if (segment == null || typeof segment !== 'object') {
            return false;
        }
        if (!segment.hasOwnProperty('name')) {
            return false;
        }
        state.elements[index] = Object.assign(state.elements[index], segment);
        return true;
    },
    updateAllSegments(state, segments) {
        if (!Array.isArray(segments)) {
            return false;
        }
        state.elements = segments;
        return true;
    }
};

const actions = {
    test: (context, args) => {
    }
    // TODO: Move mutitations to actions (delegate) + IO File update (If file exists)
};

export default {
    namespaced: true,
    state,
    mutations,
    actions
};
