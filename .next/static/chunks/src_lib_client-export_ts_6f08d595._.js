(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/lib/client-export.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "exportToDocx": (()=>exportToDocx)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/docx/build/index.mjs [app-client] (ecmascript)");
'use client';
;
async function exportToDocx(text) {
    const doc = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Document"]({
        sections: [
            {
                properties: {},
                children: text.split('\n').map((line)=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Paragraph"]({
                        children: [
                            new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["TextRun"](line)
                        ]
                    }))
            }
        ]
    });
    return await __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$docx$2f$build$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Packer"].toBlob(doc);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_lib_client-export_ts_6f08d595._.js.map