// Function to handle class changes
function handleClassChange(element) {
    console.log('Class changed for element:', element);
    console.log('New class list:', element.className);

    // Check for the specific class we're interested in
    if (element.classList.contains('media-ui-FullWidthAd_fullWidthAdWrapper-fClHZteIk3k-')) {
        console.log('Target class detected!');
        // Add your custom logic here
    }
}

// Function to observe the entire document
function observeClassChanges() {
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'attributes') {
                handleClassChange(mutation.target);
            }
        });
    });

    // Configuration for the observer
    const config = {
        attributes: true,
        attributeFilter: ['style', 'class'],
        subtree: true,
        attributeOldValue: true
    };

    // Start observing the document
    observer.observe(document.documentElement, config);

    console.log('Class change observer started');

    // Function to stop observing
    return function stopObserving() {
        observer.disconnect();
        console.log('Class change observer stopped');
    };
}

// Function to ensure the DOM is ready
function onDOMReady(callback) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback);
    } else {
        callback();
    }
}

// Start observing when the DOM is ready
onDOMReady(() => {
    observeClassChanges();
});

// You can call stopObserving() later to stop the observer
// For example:
// if (stopObserving) stopObserving();
