const { createBooking } = require('./services/bookingService');
const { Client, Band, Booking, sequelize } = require('./models');

const verifyBooking = async () => {
    try {
        console.log('Starting verification...');

        // Ensure we have a band to book
        let band = await Band.findOne();
        if (!band) {
            console.log('Creating a test band...');
            band = await Band.create({
                band_name: 'Test Band',
                genre: 'Rock',
                contact_person: 'Test Person',
                phone: '1234567890',
                price: 500.00
            });
        } else {
            // Ensure existing band has a price
            if (!band.price || parseFloat(band.price) === 0) {
                console.log('Updating band price...');
                await band.update({ price: 500.00 });
            }
        }

        const bookingData = {
            band_id: band.band_id,
            event_type: "Private Party",
            event_date: "2026-01-10",
            address: "Test Address",
            phone_number: "0978886317",
            status: "pending",
            deposit_amount: 100,
            // total_amount: 500, // Commented out to test default from band price
            special_requests: "More dancer",
            notes: "",
            client_name: "somnang_" + Date.now() // Ensure unique name for test
        };

        console.log('Creating booking with data:', bookingData);

        const booking = await createBooking(bookingData);

        console.log('Booking created successfully:', booking);

        if (parseFloat(booking.total_amount) === 500.00) {
            console.log('Total amount verified successfully (defaulted to band price)!');
        } else {
            console.error('Total amount mismatch!', booking.total_amount);
        }

        // Verify client creation
        const client = await Client.findByPk(booking.client_id);
        if (client) {
            console.log('Client found:', client.toJSON());
            if (client.name === bookingData.client_name && client.phone === bookingData.phone_number) {
                console.log('Client details match!');
            } else {
                console.error('Client details do not match!');
            }
        } else {
            console.error('Client not found!');
        }

    } catch (error) {
        console.error('Verification failed:', error.message);
        if (error.original) {
            console.error('Original error:', error.original);
        }

        try {
            console.log('Inspecting bookings table schema...');
            const [results, metadata] = await sequelize.query("SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'bookings';");
            console.log('Bookings table columns:', results);
        } catch (inspectError) {
            console.error('Failed to inspect table:', inspectError);
        }
    } finally {
        await sequelize.close();
    }
};

verifyBooking();
