const { Band, sequelize } = require('./models');

const verifyBandPrice = async () => {
    try {
        console.log('Starting band price verification...');

        // Create a new band with price
        const bandData = {
            band_name: 'Price Test Band',
            genre: 'Jazz',
            number_of_members: 4,
            contact_person: 'Test Manager',
            phone: '9876543210',
            price: 1500.50
        };

        console.log('Creating band with price:', bandData.price);
        const band = await Band.create(bandData);
        console.log('Band created:', band.toJSON());

        if (parseFloat(band.price) === 1500.50) {
            console.log('Price verified successfully!');
        } else {
            console.error('Price mismatch!', band.price);
        }

        // Update price
        console.log('Updating price to 2000.00...');
        await band.update({ price: 2000.00 });
        console.log('Band updated:', band.toJSON());

        if (parseFloat(band.price) === 2000.00) {
            console.log('Price update verified successfully!');
        } else {
            console.error('Price update mismatch!', band.price);
        }

    } catch (error) {
        console.error('Verification failed:', error);
    } finally {
        await sequelize.close();
    }
};

verifyBandPrice();
