onload = () => {
    document.querySelectorAll(".context").forEach(function() {
        this.addEventListener("contextmenu", (event) => { event.preventDefault() });
    })
    document.getElementById("create-node").addEventListener("click", handleNewNodeCursor);
    document.getElementById("clear-workspace").addEventListener("click", function() {
        cy.remove("*")
    })
    document.getElementById("save").addEventListener("click", handleSave);
    document.getElementById("load").addEventListener("click", handleLoad);
    $(".modal").draggable({
        handle: $(".modal-bar")
    });
}

// function buttons
function handleNewNodeCursor(event) {
    event.stopPropagation();
    document.getElementById("container").style.cursor = "cell";
    cy.on("tap", handleNewNodeClick);

    // handle abort
    const handleRightClick = function() {
        cy.off("tap", handleNewNodeClick);
        document.getElementById("container").removeEventListener("contextmenu", handleRightClick);
        document.getElementById("container").style.cursor = "default";
    }
    document.getElementById("container").addEventListener("contextmenu", handleRightClick);
}
function handleNewNodeClick(event) {
    let mouseX = event.position.x;
    let mouseY = event.position.y;
    let clientX = event.renderedPosition.x;
    let nodeId = Math.random();
    if (clientX <= window.innerWidth * 0.8) {
        cy.add({
            group: "nodes",
            data: { id: nodeId },
            position: { x: mouseX, y: mouseY }
        });
    }
    cy.$("node").removeListener("click");
    cy.nodes().once("click", function(event) {
        event.stopPropagation();
        handleEdgeCreation(event, this.id());
    });
    cy.$(`node#${nodeId}`).on("cxttap", function(newEvent) {
        const node = newEvent.target; // The clicked node
        const mouseX = newEvent.renderedPosition.x; // X coordinate of the mouse
        const mouseY = newEvent.renderedPosition.y; // Y coordinate of the mouse
        const nodeId = node.id(); // ID of the clicked node

        summonNodeContextMenu(event, mouseX, mouseY, nodeId);
    })

    if (!event.originalEvent.shiftKey) {
        cy.off("tap", handleNewNodeClick);
        document.getElementById("container").style.cursor = "default";
    }
}
function handleSave() {
    const graphJson = JSON.stringify(cy.json());
    const filename = "graph.json"

    const blob = new Blob([graphJson], { type: "application/json "});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
function handleLoad() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.id = "fileInput";
    input.style.position = "absolute";
    input.style.left = "-1000px";
    document.body.appendChild(input);

    document.getElementById("fileInput").addEventListener("change", function(event) {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const graphJson = JSON.parse(e.target.result);
                cy.json(graphJson);

                cy.nodes().once("click", function(event) {
                    event.stopPropagation();
                    handleEdgeCreation(event, this.id());
                });
                cy.nodes().on("cxttap", function(event) {
                    const node = event.target; // The clicked node
                    const mouseX = event.renderedPosition.x; // X coordinate of the mouse
                    const mouseY = event.renderedPosition.y; // Y coordinate of the mouse
                    const nodeId = node.id(); // ID of the clicked node
            
                    summonNodeContextMenu(event, mouseX, mouseY, nodeId);
                });
                cy.edges().on("cxttap", function(event) { handleEdgeContext(event, this.id()) });
            } catch (err) {
                console.error("Invalid JSON file:", err);
            }
        };
        reader.readAsText(file);
    })
    input.click();
    document.body.removeChild(input);
}

// ** context menus **
function summonNodeContextMenu(event, mouseX, mouseY, nodeId) {
    document.getElementById("node-context").style.top = `${mouseY}px`;
    document.getElementById("node-context").style.left = `${mouseX}px`;

    const deleteNode = activateDeleteElement("node", nodeId);
    const handleNodeLabelWrapper = activateHandleLabel("node", nodeId);
    const styleElement = activateStyleListener("node", nodeId);

    document.addEventListener("click", (event) => {
        document.getElementById("node-delete").removeEventListener("click", deleteNode);
        document.getElementById("node-label").removeEventListener("click", handleNodeLabelWrapper);
        document.getElementById("node-style").removeEventListener("click", styleElement);
        document.getElementById("node-context").style.top = `-1000px`;
    })
}
function summonEdgeContextMenu(event, mouseX, mouseY, edgeId) {
    document.getElementById("edge-context").style.top = `${mouseY}px`;
    document.getElementById("edge-context").style.left = `${mouseX}px`;

    const deleteNode = activateDeleteElement("edge", edgeId);
    const handleNodeLabelWrapper = activateHandleLabel("edge", edgeId);
    const styleElement = activateStyleListener("edge", edgeId);

    document.addEventListener("click", (event) => {
        document.getElementById("edge-delete").removeEventListener("click", deleteNode);
        document.getElementById("edge-label").removeEventListener("click", handleNodeLabelWrapper);
        document.getElementById("edge-style").removeEventListener("click", styleElement);
        document.getElementById("edge-context").style.top = `-1000px`;
    })
}
function handleEdgeContext(event, edgeId) {
    const mouseX = event.position.x;
    const mouseY = event.position.y;
    summonEdgeContextMenu(event, mouseX, mouseY, edgeId);
}
// * delete element *
function activateDeleteElement(type, nodeId) {
    // handle deleting a node
    const deleteNode = function() {
        cy.remove(cy.$(`#${nodeId}`));
    }
    if (type == "node") {
        document.getElementById("node-delete").addEventListener("click", deleteNode);
    } else if (type == "edge") {
        document.getElementById("edge-delete").addEventListener("click", deleteNode);
    }
    return deleteNode;
}
// * labels *
function activateHandleLabel(type, nodeId) {
    // handle adding a label
    const handleNodeLabelWrapper = function() {
        handleNodeLabel(type, nodeId);
    }
    if (type == "node") {
        document.getElementById("node-label").addEventListener("click", handleNodeLabelWrapper);
    } else if (type == "edge") {
        document.getElementById("edge-label").addEventListener("click", handleNodeLabelWrapper);
    }
    return handleNodeLabelWrapper;
}
function handleNodeLabel(type, nodeId) {
    document.getElementById("label-header").innerHTML = `Assign ${type} label`;
    document.getElementById("label-modal").style.top = "100px";
    document.getElementById("label-modal").style.left = "100px";
    document.getElementById("label-text").focus();

    const handleLabelSubmit = function() {
        cy.style()
          .selector(`#${nodeId}`)
          .style({
            "label": document.getElementById("label-text").value
          })
          .update();
        document.getElementById("label-modal").style.top = "-1000px";
        document.getElementById("label-text").value = "";
        removeEventListeners()
    }
    const handleLabelExit = function() {
        document.getElementById("label-modal").style.top = "-1000px";
        removeEventListeners()
    }
    const handleKeyDown = function(event) {
        if (event.key == "Enter") {
            handleLabelSubmit();
        }
    }
    const removeEventListeners = function() {
        document.getElementById("label-submit").removeEventListener("click", handleLabelSubmit);
        document.getElementById("label-modal-x").removeEventListener("click", handleLabelExit);
        document.removeEventListener("keydown", handleKeyDown);
    }

    document.getElementById("label-submit").addEventListener("click", handleLabelSubmit);
    document.getElementById("label-modal-x").addEventListener("click", handleLabelExit);
    document.addEventListener("keydown", handleKeyDown);
}
// * styles *
function activateStyleListener(type, elementId) {
    const summonStyleModalWrapper = function() {
        summonStyleModal(type, elementId);
    }
    if (type == "node") {
        document.getElementById("node-style").addEventListener("click", summonStyleModalWrapper);
    } else if (type == "edge") {
        document.getElementById("edge-style").addEventListener("click", summonStyleModalWrapper);
    }
    return summonStyleModalWrapper;
}
function summonStyleModal(type, elementId) {
    document.getElementById("style-modal").style.top = "100px";
    document.getElementById("style-modal").style.left = "100px";
    const displayStyleContentWrapper = function(event) {
        displayStyleContent(event, type, elementId)
    }
    if (type == "node") {
        document.querySelectorAll(".style-edge").forEach(function(element) {
            element.classList.add("invisible");
        })
        document.querySelectorAll(".style-node, .style-both").forEach(function(element) {
            element.classList.remove("invisible");
            element.addEventListener("click", displayStyleContentWrapper);
        })
    } if (type == "edge") {
        document.querySelectorAll(".style-node").forEach(function(element) {
            element.classList.add("invisible");
        })
        document.querySelectorAll(".style-edge, .style-both").forEach(function(element) {
            element.classList.remove("invisible");
            element.addEventListener("click", displayStyleContentWrapper);
        })
    }

    const handleStyleExit = function() {
        document.getElementById("style-modal").style.top = "-1000px";
        removeEventListeners()
    }
    const removeEventListeners = function() {
        document.getElementById("style-modal-x").removeEventListener("click", handleStyleExit);
        document.querySelectorAll(".style-node, .style-both, .style-edge").forEach(function(element) {
            element.removeEventListener("click", displayStyleContent);
        })
    }
    document.getElementById("style-modal-x").addEventListener("click", handleStyleExit);
}
function summonPicker() {
    const pickr = Pickr.create({
        el: "#picker",
        theme: 'monolith', // or 'monolith', or 'nano'
    
        swatches: [
            'rgba(244, 67, 54, 1)',
            'rgba(233, 30, 99, 0.95)',
            'rgba(156, 39, 176, 0.9)',
            'rgba(103, 58, 183, 0.85)',
            'rgba(63, 81, 181, 0.8)',
            'rgba(33, 150, 243, 0.75)',
            'rgba(3, 169, 244, 0.7)',
            'rgba(0, 188, 212, 0.7)',
            'rgba(0, 150, 136, 0.75)',
            'rgba(76, 175, 80, 0.8)',
            'rgba(139, 195, 74, 0.85)',
            'rgba(205, 220, 57, 0.9)',
            'rgba(255, 235, 59, 0.95)',
            'rgba(255, 193, 7, 1)'
        ],
    
        components: {
    
            // Main components
            preview: true,
            opacity: true,
            hue: true,
    
            // Input / output Options
            interaction: {
                hex: true,
                rgba: true,
                hsla: true,
                hsva: true,
                cmyk: true,
                input: true,
                clear: true,
                save: true
            }
        }
    });
    return pickr;
}
const commonHTML = `<h3 class="style-header">Pick Color</h3>
<div class="control-group color-buttons">
    <div class="color-button" data-color="#ffadad"></div>
    <div class="color-button" data-color="#ffd6a5"></div>
    <div class="color-button" data-color="#fdffb6"></div>
    <div class="color-button" data-color="#caffbf"></div>
    <div class="color-button" data-color="#9bf6ff"></div>
    <div class="color-button" data-color="#a0c4ff"></div>
    <div class="color-button" data-color="#bdb2ff"></div>
    <div class="color-button" data-color="#ffc6ff"></div>
</div>
<h3 class="style-header">Or pick one of your own</h3>
<div class="control-group picker-container">
    <div class="picker" id="picker"></div>
</div>`
function displayStyleContent(event, type, elementId) {
    const selection = event.target.innerHTML;
    switch(selection) {
        case "Common":
            function applyColor(elementId, color) {
                const property = type == "node" ? "background-color" : "line-color";
                cy.style()
                  .selector(`#${elementId}`)
                  .style({
                      [property]: color
                  })
                .update();
            }
            document.getElementById("style-controls").innerHTML = commonHTML;
            document.querySelectorAll(".color-button").forEach(function(element) {
                element.style.backgroundColor = element.getAttribute("data-color");

                const applyColorWrapper = function() {
                    applyColor(elementId, element.getAttribute("data-color"))
                }
                const removeListener = function() {
                    element.removeEventListener("click", applyColorWrapper);
                    document.getElementById("style-modal-x").removeEventListener("click", removeListener);
                }
                element.addEventListener("click", applyColorWrapper);
                document.getElementById("style-modal-x").addEventListener("click", removeListener);
            })
            const picker = summonPicker();
            const initializePicker = function() { 
                document.querySelector(".pcr-button").style.width = "80%" 
                document.querySelector(".pcr-button").style.marginInline = "10%" 
            }
            picker.on("init", initializePicker);
            const pickerSave = function(color) {
                applyColor(elementId, color.toRGBA().toString())
            }
            picker.on("save", pickerSave);

            const removeListeners = function() {
                picker.off("init", initializePicker);
                picker.off("save", pickerSave);
                document.getElementById("style-modal-x").removeEventListener("click", removeListeners);
                document.getElementById("style-controls").innerHTML = "";
            }
            document.getElementById("style-modal-x").addEventListener("click", removeListeners)
            break;
        case "Shape":
            break;
        case "Border":
            break;
        case "Edge Type":
            break;
        case "Arrow Options":
            break;
        case "Pie Chart":
            break;
        case "Label Options":
            break;
    }
}

// handle edge creation on node click
function handleEdgeCreation(event, nodeId) {
    event.stopPropagation();
    document.getElementById("container").style.cursor = "cell";
    const createEdge = function(event) {
        var node = event.target;
        let id = Math.random()

        // check for existing edges
        let existingEdge = cy.edges(`[source="${nodeId}"][target="${node.id()}"]`);
        if (existingEdge.length > 0) {
            console.log("Attempted edge creation on preexisting edge.");
            document.getElementById("container").style.cursor = "default";
            cy.nodes().once("click", function(event) {
                event.stopPropagation()
                handleEdgeCreation(event, this.id())
            });
            return;
        }

        let newEdge = cy.add({
            group: "edges",
            data: { id: id, source: nodeId, target: node.id() },
        });
        newEdge.on("cxttap", (event) => { handleEdgeContext(event, id) });

        document.getElementById("container").style.cursor = "default";
        cy.nodes().once("click", function(event) {
            event.stopPropagation()
            handleEdgeCreation(event, this.id())
        });
    }

    cy.nodes().once('click', createEdge);

    // handle clicks outside nodes (abort)
    cy.once("click", (event) => {
        if (event.target.group && event.target.group() === "nodes") {
            return;
        }
        document.getElementById("container").style.cursor = "default";
        cy.nodes().off("click", createEdge);
        // rearm edge creation
        cy.nodes().once("click", function(event) {
            event.stopPropagation()
            handleEdgeCreation(event, this.id())
        });
    })
    // handle right-click abort
    const handleRightClick = function() {
        cy.nodes().off("click", createEdge);
        document.getElementById("container").removeEventListener("contextmenu", handleRightClick);
        document.getElementById("container").style.cursor = "default";
        // rearm edge creation
        cy.nodes().once("click", function(event) {
            event.stopPropagation()
            handleEdgeCreation(event, this.id())
        });
    }
    document.getElementById("container").addEventListener("contextmenu", handleRightClick);
}

var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: []
});