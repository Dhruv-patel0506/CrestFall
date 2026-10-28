"""
server.py - Lightweight HTTP Server & Scenario Intelligence API.
Serves the web UI and provides REST endpoints connecting to the Python algorithm engine.
"""

import http.server
import socketserver
import json
import os
import sys
import urllib.parse

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from algorithm.schemas import Company, Financials, Market, Macro, SimulationScenarioConfig
from algorithm.simulator import FinancialSimulator
from algorithm.permutation_matrix import PermutationEngine
from algorithm.calibration import ModelCalibrator

PORT = 8080
WEB_DIR = os.path.join(CURRENT_DIR, "web")

def load_database():
    with open(os.path.join(CURRENT_DIR, "data", "sample_database.json"), "r") as f:
        return json.load(f)

class ScenarioServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == "/api/companies":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            db = load_database()
            self.wfile.write(json.dumps(db["companies"]).encode("utf-8"))
        elif parsed.path == "/api/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"status": "healthy", "engine": "ScenarioPulse v2.4"}).encode("utf-8"))
        else:
            super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else "{}"
        payload = json.loads(body) if body else {}

        if parsed.path == "/api/simulate":
            company_id = payload.get("company_id", "AAPL")
            cfg_dict = payload.get("config", {})

            db = load_database()
            c_raw = next((c for c in db["companies"] if c["company_id"] == company_id), db["companies"][0])

            company = Company(
                company_id=c_raw["company_id"],
                company_name=c_raw["company_name"],
                ticker=c_raw["ticker"],
                exchange=c_raw["exchange"],
                main_country=c_raw["main_country"],
                niche=c_raw["niche"],
                currency=c_raw["currency"],
                fiscal_year_end=c_raw["fiscal_year_end"]
            )
            fin = Financials(**c_raw["financials"])
            mkt = Market(**c_raw["market"])
            mac = Macro(**c_raw["macro"])

            sim = FinancialSimulator(company, fin, mkt, mac)
            cfg = SimulationScenarioConfig(**cfg_dict)
            res = sim.run_simulation(cfg)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

            # Serialize SimulationResult
            output = {
                "company_id": res.company_id,
                "company_name": res.company_name,
                "niche": res.niche,
                "summary": res.summary_metrics,
                "monthly_snapshots": [s.__dict__ for s in res.monthly_snapshots]
            }
            self.wfile.write(json.dumps(output).encode("utf-8"))

        elif parsed.path == "/api/calibrate":
            db = load_database()
            c_raw = db["companies"][0]
            company = Company(
                company_id=c_raw["company_id"],
                company_name=c_raw["company_name"],
                ticker=c_raw["ticker"],
                exchange=c_raw["exchange"],
                main_country=c_raw["main_country"],
                niche=c_raw["niche"],
                currency=c_raw["currency"],
                fiscal_year_end=c_raw["fiscal_year_end"]
            )
            fin = Financials(**c_raw["financials"])
            mkt = Market(**c_raw["market"])
            mac = Macro(**c_raw["macro"])

            sim = FinancialSimulator(company, fin, mkt, mac)
            calibrator = ModelCalibrator(sim)
            
            ground_truth_rev = [16500.0, 15800.0, 18200.0, 21000.0, 24000.0, 25500.0]
            ground_truth_margins = [38.2, 38.0, 38.5, 39.1, 40.2, 40.5]
            calib_res = calibrator.calibrate_against_historical("enable_covid", ground_truth_rev, ground_truth_margins)

            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(json.dumps(calib_res).encode("utf-8"))
        else:
            self.send_response(404)
            self.end_headers()

def run_server():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), ScenarioServerHandler) as httpd:
        print(f"Server started on http://localhost:{PORT}")
        print(f"Serving web client from {WEB_DIR}")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server.")

if __name__ == '__main__':
    run_server()
