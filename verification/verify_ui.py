from playwright.sync_api import Page, expect, sync_playwright
import time
import os

def verify_main_menu(page: Page):
    try:
        # Create verification directory if it doesn't exist
        verification_dir = os.path.join(os.getcwd(), 'verification')
        os.makedirs(verification_dir, exist_ok=True)

        # Navigate to the app
        print("Navigating to app...")
        page.goto("http://localhost:5173")

        # Wait for the main menu to load
        print("Waiting for main menu...")
        expect(page.locator("h1")).to_contain_text("ELITE FORCE")

        # Take a screenshot of the main menu
        print("Taking main menu screenshot...")
        page.screenshot(path=os.path.join(verification_dir, "main-menu-verification.png"))
        print("Main menu screenshot saved.")

        # Navigate to HUD by starting a new game
        print("Starting new game...")
        page.get_by_role("button", name="NEW GAME").click()

        # Wait for first dialogue box
        print("Waiting for dialogue...")
        expect(page.locator(".dialogue-box")).to_be_visible()

        # Click next through dialogue
        print("Skipping dialogue...")
        for i in range(3):
            page.get_by_role("button", name="NEXT >>").click()
            time.sleep(0.5)

        # Click BEGIN MISSION
        print("Clicking BEGIN MISSION...")
        page.get_by_role("button", name="BEGIN MISSION").click()

        # Wait for game to load (HUD appears)
        print("Waiting for HUD...")

        # Check for HUD container
        expect(page.locator(".hud-container")).to_be_visible(timeout=10000)

        # Take a screenshot of the HUD
        print("Taking HUD screenshot...")
        page.screenshot(path=os.path.join(verification_dir, "hud-verification.png"))
        print("HUD screenshot saved.")

    except Exception as e:
        print(f"Error: {e}")
        try:
             page.screenshot(path=os.path.join(verification_dir, "error.png"))
        except:
            pass
        raise e

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        try:
            verify_main_menu(page)
        finally:
            browser.close()
