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
        return;
    },
    removeSegment(state, index) {
        if (
            typeof index !== 'number' ||
            isNaN(index) ||
            !isFinite(index) ||
            index < 0 ||
            state.elements.length < index
        ) {
            return;
        }
        state.elements.splice(index, 1);
        return;
    },
    addSegment(state, segment) {
        if (segment == null || typeof segment !== 'object') {
            return;
        }
        if (!segment.hasOwnProperty('name')) {
            return;
        }
        state.elements.push(segment);
        return;
    },
    updateSegment(state, data) {
        if (data == null || typeof data !== 'object') {
            return;
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
            return;
        }
        if (segment == null || typeof segment !== 'object') {
            return;
        }
        if (!segment.hasOwnProperty('name')) {
            return;
        }
        state.elements[index] = Object.assign(state.elements[index], segment);
        return true;
    },
    updateAllSegments(state, segments) {
        if (!Array.isArray(segments)) {
            return;
        }
        state.elements = segments;
        return;
    }
};

const actions = {
    test: (context, args) => {
        context.commit('updateAllSegments', [{name: 'yeet'}]);
    }
};

export default {
    namespaced: true,
    state,
    mutations,
    actions
};
