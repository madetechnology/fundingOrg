document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll("body > div, section"); // Select full-height sections
    let currentIndex = 0;

    function scrollToSection(index) {
        if (index >= 0 && index < sections.length) {
            currentIndex = index;
            sections[index].scrollIntoView({ behavior: "smooth" });
        }
    }

    window.addEventListener("wheel", (event) => {
        if (event.deltaY > 0) {
            // Scroll down
            scrollToSection(currentIndex + 1);
        } else if (event.deltaY < 0) {
            // Scroll up
            scrollToSection(currentIndex - 1);
        }
        event.preventDefault(); // Prevent default scrolling behavior
    });
});