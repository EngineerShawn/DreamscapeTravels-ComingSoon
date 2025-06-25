export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email } = req.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: 'A valid email is required.' });
    }

    const MAILERLITE_API_KEY = process.env.MAILERLITE_API_KEY;
    const MAILERLITE_GROUP_ID = process.env.MAILERLITE_GROUP_ID;

    if (!MAILERLITE_API_KEY || !MAILERLITE_GROUP_ID) {
        return res.status(500).json({ message: 'Server configuration error.' });
    }

    const subscriber = {
        email: email,
        groups: [MAILERLITE_GROUP_ID],
        status: 'active',
    };

    try {
        const response = await fetch('https://connect.mailerlite.com/api/subscribers', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MAILERLITE_API_KEY}`,
            },
            body: JSON.stringify(subscriber),
        });

        const data = await response.json();

        if (!response.ok) {
            // MailerLite might return errors in data.error.message
            const errorMessage = data?.error?.message || 'Failed to subscribe.';
            throw new Error(errorMessage);
        }

        return res.status(201).json({ message: 'Successfully subscribed!' });

    } catch (error) {
        console.error('MailerLite API Error:', error);
        return res.status(500).json({ message: error.message || 'An internal error occurred.' });
    }
}