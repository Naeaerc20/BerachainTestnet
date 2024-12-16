import os
import sys
import json
import random
import time
import requests
import re
from web3 import Web3
from twocaptcha import TwoCaptcha
from colorama import init, Fore, Style
from concurrent.futures import ThreadPoolExecutor, as_completed

# Initialize colorama
init(autoreset=True)

# Configuration Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))
WALLETS_PATH = os.path.join(BASE_DIR, 'wallets.json')
PROXIES_PATH = os.path.join(BASE_DIR, 'scripts', 'proxies.txt')

# Faucet Configuration
CHAIN_ID = 1
FAUCET_URL = 'https://bartiofaucet.berachain.com/api/claim'
SITE_KEY = '0x4AAAAAAARdAuciFArKhVwt'
WEBSITE_URL = 'https://bartio.faucet.berachain.com/'

# Icons
SUCCESS_ICON = '✅'
FAILURE_ICON = '❌'
INFO_ICON = 'ℹ️'
SECTION_DIVIDER = '#' * 75

# Maximum number of concurrent threads for balance verification
MAX_WORKERS_BALANCE = 10

# Initialize RPC_URL and API_KEY as empty strings
RPC_URL = ''
API_KEY = ''

def update_self_variable(variable_name, new_value):
    """
    Updates the value of a variable in the current script file.

    Args:
        variable_name (str): The name of the variable to update.
        new_value (str): The new value to assign to the variable.
    """
    try:
        script_path = os.path.realpath(__file__)
        with open(script_path, 'r') as file:
            lines = file.readlines()

        with open(script_path, 'w') as file:
            for line in lines:
                if line.strip().startswith(variable_name):
                    # Replace the line with the new value
                    indent = re.match(r'\s*', line).group()
                    line = f"{indent}{variable_name} = '{new_value}'\n"
                file.write(line)
        print(f"{SUCCESS_ICON} {variable_name} has been updated successfully.")
    except Exception as e:
        print(f"{FAILURE_ICON} Error updating {variable_name}: {e}")
        sys.exit(1)

def initialize_credentials():
    """
    Checks if RPC_URL and API_KEY are set. If not, prompts the user to input them
    and updates the script file accordingly.
    """
    global RPC_URL, API_KEY

    needs_update = False

    if not RPC_URL:
        RPC_URL = input("RPC URL is empty. Please enter your Ethereum RPC Node URL: ").strip()
        update_self_variable('RPC_URL', RPC_URL)
        needs_update = True

    if not API_KEY:
        API_KEY = input("API KEY is empty. Please enter your 2CAPTCHA API Key: ").strip()
        update_self_variable('API_KEY', API_KEY)
        needs_update = True

    if not needs_update:
        print(f"{SUCCESS_ICON} RPC_URL and API_KEY are already set.")

def load_wallets(path):
    try:
        with open(path, 'r') as file:
            wallets = json.load(file)
        print(f"{INFO_ICON} Loaded {len(wallets)} wallets.")
        return wallets
    except Exception as e:
        print(f"{FAILURE_ICON} Error loading wallets: {e}")
        sys.exit(1)

def load_proxies(path):
    try:
        with open(path, 'r') as file:
            proxies = [line.strip() for line in file if line.strip()]
        print(f"{INFO_ICON} Loaded {len(proxies)} proxies.")
        return proxies
    except Exception as e:
        print(f"{FAILURE_ICON} Error loading proxies: {e}")
        sys.exit(1)

def get_balance(web3, wallet_address):
    try:
        balance_wei = web3.eth.get_balance(wallet_address)
        balance_eth = web3.fromWei(balance_wei, 'ether')
        return balance_eth
    except Exception as e:
        print(f"{FAILURE_ICON} Error fetching balance for {wallet_address}: {e}")
        return 0

def solve_captcha():
    solver = TwoCaptcha(API_KEY)
    try:
        result = solver.turnstile(
            sitekey=SITE_KEY,
            url=WEBSITE_URL
        )
        captcha_code = result.get('code')
        return captcha_code
    except Exception as e:
        print(f"{FAILURE_ICON} Captcha solving failed: {e}")
        return None

def get_public_ip(proxy):
    proxies_dict = {
        'http': proxy,
        'https': proxy
    }
    try:
        response = requests.get('https://api.ipify.org?format=json', proxies=proxies_dict, timeout=10)
        if response.status_code == 200:
            ip = response.json().get('ip', 'Unknown')
            return ip
        else:
            return 'Unknown'
    except Exception:
        print(f"{FAILURE_ICON} Error retrieving public IP using proxy {proxy}.")
        return 'Unknown'

def send_faucet_request(wallet_address, captcha_code, proxy):
    headers = {
        'Authorization': f'Bearer {captcha_code}',
        'Content-Type': 'application/json'
    }
    data = {
        'address': wallet_address
    }
    proxies_dict = {
        'http': proxy,
        'https': proxy
    }
    try:
        response = requests.post(FAUCET_URL, headers=headers, json=data, proxies=proxies_dict, timeout=10)
        if response.status_code == 200:
            msg = response.json().get('msg', 'No message provided.')
            print(f"{SUCCESS_ICON} Request Successful for Wallet {wallet_address}: {msg}")
        elif response.status_code == 429:
            print(f"{FAILURE_ICON} Failed to claim faucet for Wallet {wallet_address}. Already claimed before the required wait time.")
        else:
            print(f"{FAILURE_ICON} Failed to claim faucet for Wallet {wallet_address}. Status Code: {response.status_code}")
    except Exception as e:
        print(f"{FAILURE_ICON} Error sending faucet request for Wallet {wallet_address}: {e}")

def extract_proxy_id(proxy):
    """
    Extracts the Proxy ID from the proxy format.
    Example proxy: 
    socks5://username-zone-session-proxyid-sessTime-time:password@proxy_ip:port
    Proxy ID: proxyid
    """
    try:
        match = re.search(r'session-([^-]+)-sessTime', proxy)
        if match:
            return match.group(1)
        else:
            return 'Unknown'
    except Exception:
        print(f"{FAILURE_ICON} Error extracting Proxy ID from {proxy}.")
        return 'Unknown'

def process_wallet(wallet_address, proxies, web3):
    print(f"\n{SECTION_DIVIDER}")
    print(f"Claiming Faucet for Wallet: [{wallet_address}]")
    
    print("Solving CAPTCHA...")
    captcha_code = solve_captcha()
    if not captcha_code:
        print(f"{FAILURE_ICON} Captcha solving failed. Skipping wallet {wallet_address}.")
        print(f"{SECTION_DIVIDER}")
        return
    print(f"{SUCCESS_ICON} Captcha Solved")
    
    # Select a random proxy
    proxy = random.choice(proxies)
    proxy_id = extract_proxy_id(proxy)
    
    print("Selecting Proxy & Retrieving Public IP...")
    public_ip = get_public_ip(proxy)
    print(f"Proxy ID: {proxy_id} - Public IP: {public_ip}")
    
    print("Sending Claiming Request")
    send_faucet_request(wallet_address, captcha_code, proxy)
    
    print("Waiting 5 Seconds before processing next Wallet...")
    print(f"{SECTION_DIVIDER}")
    time.sleep(5)

def verify_balances(web3, wallets):
    eligible_wallets = []
    print(f"\n{INFO_ICON} Verifying wallet balances...")
    with ThreadPoolExecutor(max_workers=MAX_WORKERS_BALANCE) as executor:
        future_to_wallet = {executor.submit(get_balance, web3, wallet.get('wallet')): wallet.get('wallet') for wallet in wallets}
        for future in as_completed(future_to_wallet):
            wallet_address = future_to_wallet[future]
            try:
                balance = future.result()
                if balance >= 0.001:
                    eligible_wallets.append(wallet_address)
            except Exception as e:
                print(f"{FAILURE_ICON} Error processing wallet {wallet_address}: {e}")
    return eligible_wallets

def main_flow(wallets, proxies, web3):
    # Verify balances concurrently
    eligible_wallets = verify_balances(web3, wallets)
    
    total_eligible = len(eligible_wallets)
    print(f"{INFO_ICON} {total_eligible} wallets are eligible for faucet claim.")
    
    if not eligible_wallets:
        print(f"{INFO_ICON} No wallets eligible for faucet claim.")
        return
    
    # Shuffle wallets without printing
    random.shuffle(eligible_wallets)
    
    # Process each wallet sequentially
    for wallet_address in eligible_wallets:
        process_wallet(wallet_address, proxies, web3)
    
    print(f"\n{SUCCESS_ICON} All eligible wallets have been processed.")

def main():
    # Initialize credentials by checking if RPC_URL and API_KEY are set
    if not RPC_URL or not API_KEY:
        initialize_credentials()
    
    # Load wallets and proxies
    wallets = load_wallets(WALLETS_PATH)
    proxies = load_proxies(PROXIES_PATH)

    # Connect to Web3
    web3 = Web3(Web3.HTTPProvider(RPC_URL))
    if not web3.isConnected():
        print(f"{FAILURE_ICON} Unable to connect to Ethereum node.")
        sys.exit(1)
    else:
        print(f"{SUCCESS_ICON} Connected to Ethereum node.")

    # Initial interaction to keep the script running
    while True:
        user_input = input("Do you want to keep the script running every 8-10 hours? (y/n): ").strip().lower()
        if user_input not in ['y', 'n']:
            print("Please enter 'y' for yes or 'n' for no.")
            continue
        break

    if user_input == 'y':
        print(f"{INFO_ICON} Script will run every 8-10 hours. Press Ctrl+C to stop.")
        try:
            while True:
                main_flow(wallets, proxies, web3)
                # Generate random wait time between 8 and 10 hours (28800 to 36000 seconds)
                wait_time = random.randint(28800, 36000)
                hours = wait_time // 3600
                minutes = (wait_time % 3600) // 60
                seconds = wait_time % 60
                print(f"{INFO_ICON} Waiting for {hours}h {minutes}m {seconds}s before next run...\n")
                time.sleep(wait_time)
        except KeyboardInterrupt:
            print(f"\n{SUCCESS_ICON} Script terminated by user.")
            sys.exit(0)
        except Exception as e:
            print(f"{FAILURE_ICON} An unexpected error occurred: {e}")
            sys.exit(1)
    else:
        print(f"\n{INFO_ICON} Running the script once.\n")
        main_flow(wallets, proxies, web3)
        print(f"\n{SUCCESS_ICON} Script execution completed.")
        sys.exit(0)

if __name__ == "__main__":
    main()
