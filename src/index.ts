import app from "./server"
import { startTradesMonitor } from "./vfl/automation/trades_monitor"
import { startScoresMonitor } from "./vfl/automation/scores_monitor"

const port = process.env.PORT || 3002
app.listen(port, () => {
  console.log(`server started on ${port}`);
  
  // Start VFL automation systems
  console.log('🚀 Starting VFL Manager automation systems...');
  startTradesMonitor();
  startScoresMonitor();
  console.log('✅ VFL Manager automation systems started!');
});
