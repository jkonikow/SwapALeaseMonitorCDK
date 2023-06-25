const { runMonitor } = require("@jkonikow/swap-a-lease-monitor");


exports.handler = async function(event) {
    console.log(`${event.monitorName} event input:`, JSON.stringify(event, undefined, 2));
    const props = {
        monitorName: event.monitorName,
        zip: event.zip,
        minMilesPerMonth: event.minMilesPerMonth,
        maxMonthsRemaining: event.maxMonthsRemaining,
        maxLeasePayment: event.maxLeasePayment,
        radiusMiles: event.maxMilesFromZip,
        preferredMakes: event.preferredMakes
    };

    await runMonitor(props);
    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `Successfully monitored for ${event.monitorName} leases`
    };
};