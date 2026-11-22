(() => {
    const apiUrl = endpoint => new URL(`../backend/auth/${endpoint}`, window.location.href);

    const readResponse = async response => {
        let payload;
        try {
            payload = await response.json();
        } catch {
            throw new Error('The authentication service returned an invalid response.');
        }
        if (!response.ok) {
            throw new Error(payload.error || 'The authentication request could not be completed.');
        }
        return payload;
    };

    const request = async (endpoint, data) => {
        const response = await fetch(apiUrl(endpoint), {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify(data)
        });
        return readResponse(response);
    };

    const session = async () => {
        const response = await fetch(apiUrl('session.php'), {
            credentials: 'same-origin',
            headers: { Accept: 'application/json' }
        });
        return readResponse(response);
    };

    window.StudyPlannerAuth = { request, session };
})();