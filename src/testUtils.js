// jsdom implements neither of these, and the receipt writes a file when it opens.
export const stubDownloads = () => {
    URL.createObjectURL = jest.fn(() => 'blob:stub');
    URL.revokeObjectURL = jest.fn();
    HTMLAnchorElement.prototype.click = jest.fn();
};

// The browser's sequential focus order: positive tabindex first in ascending
// order, then tabindex 0 / natural in document order. -1 and disabled are skipped.
export const tabOrder = () => {
    const nodes = [...document.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')]
        .filter((el) => !el.disabled && el.tabIndex >= 0);
    const positive = nodes.filter((el) => el.tabIndex > 0).sort((a, b) => a.tabIndex - b.tabIndex);

    return [...positive, ...nodes.filter((el) => el.tabIndex === 0)].map((el) => el.id || el.tagName.toLowerCase());
};
