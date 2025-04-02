document.addEventListener("DOMContentLoaded", function () {
    const blogCards = document.querySelectorAll(".blog-card");

    blogCards.forEach((card) => {
        const readMoreLink = card.querySelector("a");
        const paragraph = card.querySelector("p");

        let fullText = paragraph.textContent; 
        let shortText = fullText.substring(0, 60) + "..."; 

        paragraph.textContent = shortText;

        readMoreLink.addEventListener("click", function (event) {
            event.preventDefault();

            if (paragraph.textContent === shortText) {
                paragraph.textContent = fullText;
                readMoreLink.textContent = "Read Less";
            } else {
                paragraph.textContent = shortText;
                readMoreLink.textContent = "Read More";
            }
        });
    });
});
