/**
 * progress-tracker.js
 * Tracks user interaction with learning content and reports it to the server.
 */

// Initialize the progress tracker
const ProgressTracker = (function() {
    // Configuration
    const config = {
        apiEndpoint: '/progress/api/track',
        scrollThreshold: 10, // Minimum scroll % change to trigger an event
        timeTrackingInterval: 30, // Seconds between time tracking reports
        debounceDelay: 300 // Milliseconds to debounce scroll events
    };

    // State variables
    let state = {
        chapterId: null,
        pageId: null,
        pageTitle: null,
        lastScrollPercent: 0,
        timeSpent: 0,
        timeIntervalId: null,
        isTracking: false
    };

    /**
     * Initialize the tracker on a page
     * @param {Object} options Configuration options
     */
    function init(options = {}) {
        // Get page identifiers from data attributes or options
        const contentElement = document.querySelector('.learning-content') || document.body;
        state.chapterId = options.chapterId || contentElement.dataset.chapterId || getChapterIdFromUrl();
        state.pageId = options.pageId || contentElement.dataset.pageId || getPageIdFromUrl();
        state.pageTitle = options.pageTitle || document.title;

        if (!state.chapterId || !state.pageId) {
            console.warn('ProgressTracker: Missing chapter or page ID. Tracking disabled.');
            return;
        }

        // Start tracking
        state.isTracking = true;
        startScrollTracking();
        startTimeTracking();

        // Track initial page view
        trackEvent('page_view');

        // Add event listener for page unload
        window.addEventListener('beforeunload', handleUnload);

        console.log(`ProgressTracker: Initialized for ${state.chapterId}/${state.pageId}`);
    }

    /**
     * Extract chapter ID from URL path
     */
    function getChapterIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i].startsWith('chapter')) {
                return pathParts[i];
            }
        }
        return null;
    }

    /**
     * Extract page ID from URL path
     */
    function getPageIdFromUrl() {
        const pathParts = window.location.pathname.split('/');
        const filename = pathParts[pathParts.length - 1].split('.')[0];
        return filename || 'index';
    }

    /**
     * Start tracking scroll events
     */
    function startScrollTracking() {
        // Use debounce to prevent too many events
        let debounceTimer;
        window.addEventListener('scroll', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(trackScrollPosition, config.debounceDelay);
        });
        
        // Initial scroll position
        trackScrollPosition();
    }

    /**
     * Track current scroll position
     */
    function trackScrollPosition() {
        if (!state.isTracking) return;
        
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return; // Avoid division by zero
        
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollPercent = Math.round((scrollTop / scrollHeight) * 100);
        
        // Only send update if scroll percentage changed significantly
        if (Math.abs(scrollPercent - state.lastScrollPercent) >= config.scrollThreshold) {
            state.lastScrollPercent = scrollPercent;
            trackEvent('scroll', { scroll_percent: scrollPercent });
        }
    }

    /**
     * Start tracking time spent on page
     */
    function startTimeTracking() {
        // Clear any existing interval
        if (state.timeIntervalId) {
            clearInterval(state.timeIntervalId);
        }
        
        // Reset time counter
        state.timeSpent = 0;
        
        // Set up interval to track time
        state.timeIntervalId = setInterval(() => {
            if (document.visibilityState === 'visible') {
                state.timeSpent += config.timeTrackingInterval;
                trackEvent('time_spent', { seconds: config.timeTrackingInterval });
            }
        }, config.timeTrackingInterval * 1000);
    }

    /**
     * Handle page unload to save final stats
     */
    function handleUnload() {
        if (state.timeIntervalId) {
            clearInterval(state.timeIntervalId);
        }
        
        // Track final time and scroll position
        // Note: This might not always succeed due to page unload timing
        trackScrollPosition();
        navigator.sendBeacon(config.apiEndpoint, JSON.stringify({
            chapter_id: state.chapterId,
            page_id: state.pageId,
            event_type: 'page_exit',
            time_spent: state.timeSpent
        }));
    }

    /**
     * Track exercise attempt
     * @param {Object} exerciseData Exercise data
     */
    function trackExercise(exerciseData) {
        if (!state.isTracking) return;
        
        const payload = {
            exercise_id: exerciseData.id,
            exercise_title: exerciseData.title,
            code: exerciseData.code,
            is_correct: exerciseData.isCorrect
        };
        
        trackEvent('exercise_attempt', payload);
    }

    /**
     * Send tracking event to the server
     * @param {string} eventType Type of event
     * @param {Object} eventData Additional event data
     */
    function trackEvent(eventType, eventData = {}) {
        if (!state.isTracking) return;
        
        const payload = {
            chapter_id: state.chapterId,
            page_id: state.pageId,
            page_title: state.pageTitle,
            event_type: eventType,
            timestamp: new Date().toISOString(),
            ...eventData
        };
        
        // Send data to server
        fetch(config.apiEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
        })
        .catch(error => {
            console.error('ProgressTracker: Error sending tracking data', error);
        });
    }

    // Public API
    return {
        init,
        trackExercise,
        trackEvent
    };
})();

// Auto-initialize if data attributes are present
document.addEventListener('DOMContentLoaded', function() {
    const contentElement = document.querySelector('[data-chapter-id][data-page-id]');
    if (contentElement) {
        ProgressTracker.init({
            chapterId: contentElement.dataset.chapterId,
            pageId: contentElement.dataset.pageId
        });
    }
    
    // Setup event listener for code run button if present
    const runButton = document.getElementById('runButton');
    if (runButton) {
        runButton.addEventListener('click', function() {
            const editor = window.editor; // Assuming editor is globally available
            if (editor) {
                // Get code from editor
                const code = editor.getValue();
                
                // Track exercise attempt
                // Note: You'll need to implement the success/failure detection
                ProgressTracker.trackEvent('code_execution', {
                    code_length: code.length,
                    code_snippet: code.substring(0, 100) // Just for identification, not the full code
                });
            }
        });
    }
});
