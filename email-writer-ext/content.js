console.log("Email Writer Extension - Content Script Loaded");

function findComposeToolbar() {
    const selectors = [
        '.btC' , 
        '.aDh' , 
        '[role="toolbar"]',
        '.gU.Up'
    ];

    for (const selector of selectors) {
        const toolbar = document.querySelector(selector);
        if (toolbar) {
            return toolbar;
        }
        return null;
    }
}

function createAIButton() {
    const button = document.createElement('div');
    button.className = 'T-J J-J5-Ji aoO v7 T-I-atl L3';
    button.style.marginRight = '8px' ; 
    button.innerHTML = 'AI Reply';
    button.setAttribute('role' , 'button')
    button.setAttribute('data-tooltip' , 'Generate AI Reply')
    return button ; 
}

function getEmailContent() {
    const selectors = [
        '.h7' , 
        '.a3s.aiL' , 
        '.gmail_quote',
        '[role="presentation"]'
    ];

    for (const selector of selectors) {
        const content = document.querySelector(selector);
        if (content) {
            return content.innerHTML.trim();
        }
        return '';
    }
}

function injectButton () {
    const existingButton = document.querySelector('.ai-reply-button');
    if (existingButton) existingButton.remove();

    const toolbar = findComposeToolbar() ; 
    if (!toolbar) {
        console.log("Toolbar not found");
        return; 
    }

    console.log("Toolbar found , creating AI button");
    const button = createAIButton();
    button.classList.add('ai-reply-button');

    button.addEventListener('click' , async () => {
        try{
            button.innerHTML = 'Generating....';
            button.disabled = true ; 

        const emailContent = getEmailContent();
           const response =  await fetch('http://localhost:8080/api/email/generate', {
                method : 'POST' , 
                headers : {
                    'Content-Type' : 'application/json'
                },
                body : JSON.stringify({
                    emailContent : emailContent, 
                    tone : "professional"
                })
            })

            if (!response.ok) {
                throw new Error('API Request Failed');
            }

            const generatedReply = await response.text() ;
            const composeBox = document.querySelector('[role="textbox"][g_editable="true"]')
            
            if (composeBox) {
                composeBox.focus();
                document.execCommand('insertText' , false , generatedReply); 
            } else {
                console.error('ComposeBox was bot found')
            }
        } catch (error) {
            console.error(error)
            alert("Fail to generate the reply : " + {error})
        } finally {
            button.innerHTML = 'AI Reply' ; 
            button.disabled = false ; 
        }
    })

    toolbar.insertBefore(button , toolbar.firstChild);
}

const observer = new MutationObserver((mutations) => {
    for(const mutation of mutations) {
        const addedNodes = Array.from(mutation.addedNodes) ; 
        const hasComposeElements = addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.matches('.aDh , .btc , [role="dialog"]') || node.querySelector('.aDh , .btc , [role="dialog"]'))
        );

        if (hasComposeElements) {
            console.log("Compose Window Detected");
            setTimeout(injectButton , 500);
        }
    }
})

observer.observe(document.body , {
    childList : true , 
    subtree : true
}) 