from playwright.sync_api import sync_playwright

def verify_subtitle_selector():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Using python http server on port 8001 (production build)
            page.goto("http://localhost:8001/options.html")
            print("Loaded page")

            # Wait for the button "Test Subtitle Selector"
            # It might take a moment for React to hydrate/render
            page.wait_for_selector("text=Test Subtitle Selector", timeout=10000)

            # Click it
            page.click("text=Test Subtitle Selector")

            # Wait for the selector to appear
            page.wait_for_selector("text=Select Subtitle")

            # Verify languages are present
            assert page.is_visible("text=English")
            assert page.is_visible("text=Spanish")
            assert page.is_visible("text=Japanese")
            assert page.is_visible("text=(Auto)")

            # Take screenshot
            page.screenshot(path="/home/jules/verification/subtitle_selector.png")
            print("Screenshot taken")

        except Exception as e:
            print(f"Error: {e}")
            try:
                print(page.content())
            except:
                pass
        finally:
            browser.close()

if __name__ == "__main__":
    verify_subtitle_selector()
