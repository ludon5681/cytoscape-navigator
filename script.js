onload = () => {
    document.querySelectorAll(".context").forEach(function() {
        this.addEventListener("contextmenu", (event) => { event.preventDefault() });
    })
    document.getElementById("create-node").addEventListener("click", handleNewNodeCursor);
    $(".modal").draggable({
        handle: $(".modal-bar")
    });
}

// function buttons
function handleNewNodeCursor(event) {
    event.stopPropagation();
    document.getElementById("container").style.cursor = "cell";
    document.getElementById("container").addEventListener("click", handleNewNodeClick);
}
function handleNewNodeClick(event) {
    let mouseX = event.clientX;
    let mouseY = event.clientY;
    let nodeId = Math.random();
    if (mouseX <= window.innerWidth * 0.8) {
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
    cy.$(`node#${nodeId}`).on("cxttap", function(event) {
        const node = event.target; // The clicked node
        const mouseX = event.position.x; // X coordinate of the mouse
        const mouseY = event.position.y; // Y coordinate of the mouse
        const nodeId = node.id(); // ID of the clicked node

        summonNodeContextMenu(event, mouseX, mouseY, nodeId);
    })

    if (!event.shiftKey) {
        document.getElementById("container").removeEventListener("click", handleNewNodeClick);
        document.getElementById("container").style.cursor = "default";
    }
}

// context menus
function summonNodeContextMenu(event, mouseX, mouseY, nodeId) {
    document.getElementById("node-context").style.top = `${mouseY}px`;
    document.getElementById("node-context").style.left = `${mouseX}px`;

    const deleteNode = activateDeleteElement("node", nodeId);
    const handleNodeLabelWrapper = activateHandleLabel("node", nodeId);

    document.addEventListener("click", (event) => {
        document.getElementById("node-delete").removeEventListener("click", deleteNode);
        document.getElementById("node-label").removeEventListener("click", handleNodeLabelWrapper);
        document.getElementById("node-context").style.top = `-1000px`;
    })
}
function summonEdgeContextMenu(event, mouseX, mouseY, edgeId) {
    document.getElementById("edge-context").style.top = `${mouseY}px`;
    document.getElementById("edge-context").style.left = `${mouseX}px`;

    const deleteNode = activateDeleteElement("edge", edgeId);
    const handleNodeLabelWrapper = activateHandleLabel("edge", edgeId);

    document.addEventListener("click", (event) => {
        document.getElementById("edge-delete").removeEventListener("click", deleteNode);
        document.getElementById("edge-label").removeEventListener("click", handleNodeLabelWrapper);
        document.getElementById("edge-context").style.top = `-1000px`;
    })
}
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

function handleEdgeContext(event, edgeId) {
    const mouseX = event.position.x;
    const mouseY = event.position.y;
    summonEdgeContextMenu(event, mouseX, mouseY, edgeId);
}

// handle edge creation on node click
function handleEdgeCreation(event, nodeId) {
    event.stopPropagation();
    document.getElementById("container").style.cursor = "cell";
    cy.nodes().once('click', function(event) {
        var node = event.target;
        try {
            let newEdge = cy.add({
                group: "edges",
                data: { id: `${nodeId}to${node.id()}`, source: nodeId, target: node.id() },
            });
            newEdge.on("cxttap", (event) => { handleEdgeContext(event, `${nodeId}to${node.id()}`) });
        } catch {
            console.log("Attempted edge creation on preexisting edge.")
        } finally {
            document.getElementById("container").style.cursor = "default";
            cy.nodes().once("click", function(event) {
                event.stopPropagation()
                handleEdgeCreation(event, this.id())
            });
        }
    });
}

var cy = cytoscape({
    container: document.getElementById("cy"),
    elements: []
});