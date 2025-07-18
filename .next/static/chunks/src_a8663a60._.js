(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/src/components/ui/card.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "Card": (()=>Card),
    "CardContent": (()=>CardContent),
    "CardDescription": (()=>CardDescription),
    "CardFooter": (()=>CardFooter),
    "CardHeader": (()=>CardHeader),
    "CardTitle": (()=>CardTitle)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("rounded-lg border bg-card text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, this));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, this));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, this));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, this));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 63,
        columnNumber: 3
    }, this));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"])(_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/card.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, this));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/ai/flows/data:f59798 [app-client] (ecmascript) <text/javascript>": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
/* __next_internal_action_entry_do_not_use__ [{"40f24016ea303258f56732dc409dd7d4a17ebd3af9":"imageToPdf"},"src/ai/flows/image-to-pdf-flow.ts",""] */ __turbopack_context__.s({
    "imageToPdf": (()=>imageToPdf)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/build/webpack/loaders/next-flight-loader/action-client-wrapper.js [app-client] (ecmascript)");
"use turbopack no side effects";
;
var imageToPdf = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createServerReference"])("40f24016ea303258f56732dc409dd7d4a17ebd3af9", __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["callServer"], void 0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$webpack$2f$loaders$2f$next$2d$flight$2d$loader$2f$action$2d$client$2d$wrapper$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["findSourceMapURL"], "imageToPdf"); //# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4vaW1hZ2UtdG8tcGRmLWZsb3cudHMiXSwic291cmNlc0NvbnRlbnQiOlsiXG4ndXNlIHNlcnZlcic7XG4vKipcbiAqIEBmaWxlT3ZlcnZpZXcgQSBmbG93IGZvciBjb252ZXJ0aW5nIG11bHRpcGxlIGltYWdlcyBpbnRvIGEgc2luZ2xlIFBERiBkb2N1bWVudC5cbiAqXG4gKiAtIGltYWdlVG9QZGYgLSBBIGZ1bmN0aW9uIHRoYXQgaGFuZGxlcyB0aGUgaW1hZ2UgdG8gUERGIGNvbnZlcnNpb24gcHJvY2Vzcy5cbiAqIC0gSW1hZ2VUb1BkZklucHV0IC0gVGhlIGlucHV0IHR5cGUgZm9yIHRoZSBmdW5jdGlvbi5cbiAqIC0gSW1hZ2VUb1BkZk91dHB1dCAtIFRoZSByZXR1cm4gdHlwZSBmb3IgdGhlIGZ1bmN0aW9uLlxuICovXG5cbmltcG9ydCB7YWl9IGZyb20gJ0AvYWkvZ2Vua2l0JztcbmltcG9ydCB7en0gZnJvbSAnZ2Vua2l0JztcbmltcG9ydCB7UERGRG9jdW1lbnQsIFBERkltYWdlfSBmcm9tICdwZGYtbGliJztcblxuY29uc3QgSW1hZ2VUb1BkZklucHV0U2NoZW1hID0gei5vYmplY3Qoe1xuICBpbWFnZURhdGFVcmlzOiB6XG4gICAgLmFycmF5KHouc3RyaW5nKCkpXG4gICAgLmRlc2NyaWJlKFxuICAgICAgXCJBbiBhcnJheSBvZiBpbWFnZSBmaWxlcyBhcyBkYXRhIFVSSXMuIEVhY2ggbXVzdCBpbmNsdWRlIGEgTUlNRSB0eXBlIGFuZCB1c2UgQmFzZTY0IGVuY29kaW5nLiBFeHBlY3RlZCBmb3JtYXQ6ICdkYXRhOjxtaW1ldHlwZT47YmFzZTY0LDxlbmNvZGVkX2RhdGE+J1wiXG4gICAgKSxcbn0pO1xuZXhwb3J0IHR5cGUgSW1hZ2VUb1BkZklucHV0ID0gei5pbmZlcjx0eXBlb2YgSW1hZ2VUb1BkZklucHV0U2NoZW1hPjtcblxuY29uc3QgSW1hZ2VUb1BkZk91dHB1dFNjaGVtYSA9IHoub2JqZWN0KHtcbiAgcGRmRGF0YVVyaTogelxuICAgIC5zdHJpbmcoKVxuICAgIC5kZXNjcmliZSgnVGhlIGdlbmVyYXRlZCBQREYgZmlsZSBhcyBhIGRhdGEgVVJJLicpLFxufSk7XG5leHBvcnQgdHlwZSBJbWFnZVRvUGRmT3V0cHV0ID0gei5pbmZlcjx0eXBlb2YgSW1hZ2VUb1BkZk91dHB1dFNjaGVtYT47XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBpbWFnZVRvUGRmKFxuICBpbnB1dDogSW1hZ2VUb1BkZklucHV0XG4pOiBQcm9taXNlPEltYWdlVG9QZGZPdXRwdXQ+IHtcbiAgcmV0dXJuIGltYWdlVG9QZGZGbG93KGlucHV0KTtcbn1cblxuY29uc3QgaW1hZ2VUb1BkZkZsb3cgPSBhaS5kZWZpbmVGbG93KFxuICB7XG4gICAgbmFtZTogJ2ltYWdlVG9QZGZGbG93JyxcbiAgICBpbnB1dFNjaGVtYTogSW1hZ2VUb1BkZklucHV0U2NoZW1hLFxuICAgIG91dHB1dFNjaGVtYTogSW1hZ2VUb1BkZk91dHB1dFNjaGVtYSxcbiAgfSxcbiAgYXN5bmMgKHtpbWFnZURhdGFVcmlzfSkgPT4ge1xuICAgIGlmIChpbWFnZURhdGFVcmlzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdObyBpbWFnZSBmaWxlcyBwcm92aWRlZCB0byBjb252ZXJ0LicpO1xuICAgIH1cblxuICAgIGNvbnN0IHBkZkRvYyA9IGF3YWl0IFBERkRvY3VtZW50LmNyZWF0ZSgpO1xuXG4gICAgZm9yIChjb25zdCBkYXRhVXJpIG9mIGltYWdlRGF0YVVyaXMpIHtcbiAgICAgICAgY29uc3QgaW1hZ2VCeXRlcyA9IEJ1ZmZlci5mcm9tKGRhdGFVcmkuc3BsaXQoJywnKVsxXSwgJ2Jhc2U2NCcpO1xuICAgICAgICBsZXQgcGRmSW1hZ2U6IFBERkltYWdlO1xuXG4gICAgICAgIGlmIChkYXRhVXJpLnN0YXJ0c1dpdGgoJ2RhdGE6aW1hZ2UvanBlZycpIHx8IGRhdGFVcmkuc3RhcnRzV2l0aCgnZGF0YTppbWFnZS9qcGcnKSkge1xuICAgICAgICAgICAgcGRmSW1hZ2UgPSBhd2FpdCBwZGZEb2MuZW1iZWRKcGcoaW1hZ2VCeXRlcyk7XG4gICAgICAgIH0gZWxzZSBpZiAoZGF0YVVyaS5zdGFydHNXaXRoKCdkYXRhOmltYWdlL3BuZycpKSB7XG4gICAgICAgICAgICBwZGZJbWFnZSA9IGF3YWl0IHBkZkRvYy5lbWJlZFBuZyhpbWFnZUJ5dGVzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIFNraXAgdW5zdXBwb3J0ZWQgaW1hZ2UgZm9ybWF0cyBmb3Igbm93LiBcbiAgICAgICAgICAgIC8vIEluIGEgcmVhbCBhcHAsIHlvdSBtaWdodCB3YW50IHRvIGhhbmRsZSB0aGlzIG1vcmUgZ3JhY2VmdWxseS5cbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgU2tpcHBpbmcgdW5zdXBwb3J0ZWQgaW1hZ2UgdHlwZSBmb3IgZGF0YSBVUkk6ICR7ZGF0YVVyaS5zdWJzdHJpbmcoMCwgMzApfS4uLmApO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCBwYWdlID0gcGRmRG9jLmFkZFBhZ2UoW3BkZkltYWdlLndpZHRoLCBwZGZJbWFnZS5oZWlnaHRdKTtcbiAgICAgICAgcGFnZS5kcmF3SW1hZ2UocGRmSW1hZ2UsIHtcbiAgICAgICAgICAgIHg6IDAsXG4gICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgd2lkdGg6IHBkZkltYWdlLndpZHRoLFxuICAgICAgICAgICAgaGVpZ2h0OiBwZGZJbWFnZS5oZWlnaHQsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHBkZkJ5dGVzID0gYXdhaXQgcGRmRG9jLnNhdmUoKTtcbiAgICBjb25zdCBwZGZCYXNlNjQgPSBCdWZmZXIuZnJvbShwZGZCeXRlcykudG9TdHJpbmcoJ2Jhc2U2NCcpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIHBkZkRhdGFVcmk6IGBkYXRhOmFwcGxpY2F0aW9uL3BkZjtiYXNlNjQsJHtwZGZCYXNlNjR9YCxcbiAgICB9O1xuICB9XG4pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJxU0E4QnNCIn0=
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "ImageToPdfPage": (()=>ImageToPdfPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/loader-circle.js [app-client] (ecmascript) <export default as Loader2>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileUp$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/file-up.js [app-client] (ecmascript) <export default as FileUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-client] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image.js [app-client] (ecmascript) <export default as Image>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/image-plus.js [app-client] (ecmascript) <export default as ImagePlus>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/button.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/translations.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$language$2d$context$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/language-context.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$ai$2f$flows$2f$data$3a$f59798__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__ = __turbopack_context__.i("[project]/src/ai/flows/data:f59798 [app-client] (ecmascript) <text/javascript>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
;
;
;
;
;
;
;
const blobToBase64 = (blob)=>{
    return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onloadend = ()=>{
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Failed to convert blob to Base64.'));
            }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
};
function ImageToPdfPage() {
    _s();
    const [files, setFiles] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [isConverting, setIsConverting] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isDragging, setIsDragging] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const fileInputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const { toast } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"])();
    const langContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$language$2d$context$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LanguageContext"]);
    if (!langContext) {
        throw new Error('ImageToPdfPage must be used within a LanguageProvider');
    }
    const { language } = langContext;
    const t = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "ImageToPdfPage.useMemo[t]": ()=>__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$translations$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["allTranslations"][language]
    }["ImageToPdfPage.useMemo[t]"], [
        language
    ]);
    const handleFileSelect = (selectedFiles)=>{
        if (!selectedFiles) return;
        const newFiles = Array.from(selectedFiles).filter((file)=>file.type.startsWith('image/'));
        if (newFiles.length !== selectedFiles.length) {
            toast({
                title: t.invalidFileType,
                description: t.selectImageFile,
                variant: "destructive"
            });
        }
        setFiles((prev)=>[
                ...prev,
                ...newFiles
            ]);
    };
    const handleRemoveFile = (index)=>{
        setFiles((prev)=>prev.filter((_, i)=>i !== index));
    };
    const handleConvert = async ()=>{
        if (files.length === 0) {
            toast({
                title: t.conversionError,
                description: t.conversionErrorDescription,
                variant: "destructive"
            });
            return;
        }
        setIsConverting(true);
        try {
            const fileUris = await Promise.all(files.map((file)=>blobToBase64(file)));
            const { pdfDataUri } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$ai$2f$flows$2f$data$3a$f59798__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$text$2f$javascript$3e$__["imageToPdf"])({
                imageDataUris: fileUris
            });
            const byteCharacters = atob(pdfDataUri.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for(let i = 0; i < byteCharacters.length; i++){
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([
                byteArray
            ], {
                type: 'application/pdf'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'converted.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setFiles([]);
        } catch (e) {
            toast({
                title: t.conversionError,
                description: e.message || 'An unknown error occurred.',
                variant: 'destructive'
            });
        } finally{
            setIsConverting(false);
        }
    };
    const handleDragEvents = (e)=>{
        e.preventDefault();
        e.stopPropagation();
    };
    const handleDragEnter = (e)=>{
        handleDragEvents(e);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true);
        }
    };
    const handleDragLeave = (e)=>{
        handleDragEvents(e);
        setIsDragging(false);
    };
    const handleDrop = (e)=>{
        handleDragEvents(e);
        setIsDragging(false);
        handleFileSelect(e.dataTransfer.files);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col h-full bg-background text-foreground",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                className: "flex-grow p-4 md:p-6 grid grid-cols-1 gap-6 relative",
                onDragEnter: handleDragEnter,
                onDragOver: handleDragEvents,
                onDragLeave: handleDragLeave,
                onDrop: handleDrop,
                style: {
                    minHeight: files.length === 0 ? '80vh' : 'auto'
                },
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col items-center justify-center text-center rounded-2xl border-2 border-border bg-card h-full transition-colors p-6", isDragging && "border-primary bg-primary/10", files.length > 0 && "items-start justify-start"),
                        children: files.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col items-center justify-center h-full w-full cursor-pointer",
                            onClick: ()=>fileInputRef.current?.click(),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$file$2d$up$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__FileUp$3e$__["FileUp"], {
                                    className: "w-16 h-16 text-muted-foreground/30 mb-4"
                                }, void 0, false, {
                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                    lineNumber: 148,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-semibold",
                                    children: t.imageToPdfTitle
                                }, void 0, false, {
                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                    lineNumber: 149,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-muted-foreground mt-2",
                                    children: t.dropImages
                                }, void 0, false, {
                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                    lineNumber: 150,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                            lineNumber: 147,
                            columnNumber: 21
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full h-full flex flex-col",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-xl font-semibold text-left mb-4",
                                    children: t.imagesToConvert
                                }, void 0, false, {
                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                    lineNumber: 154,
                                    columnNumber: 25
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 overflow-y-auto pr-2",
                                    children: [
                                        files.map((file, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative aspect-square group",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                        src: URL.createObjectURL(file),
                                                        alt: `Preview ${index}`,
                                                        layout: "fill",
                                                        objectFit: "cover",
                                                        className: "rounded-md"
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                        lineNumber: 158,
                                                        columnNumber: 36
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                                                            variant: "destructive",
                                                            size: "icon",
                                                            onClick: ()=>handleRemoveFile(index),
                                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
                                                                className: "w-5 h-5"
                                                            }, void 0, false, {
                                                                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                                lineNumber: 167,
                                                                columnNumber: 44
                                                            }, this)
                                                        }, void 0, false, {
                                                            fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                            lineNumber: 166,
                                                            columnNumber: 37
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                        lineNumber: 165,
                                                        columnNumber: 36
                                                    }, this)
                                                ]
                                            }, index, true, {
                                                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                lineNumber: 157,
                                                columnNumber: 32
                                            }, this)),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>fileInputRef.current?.click(),
                                            className: "flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md text-muted-foreground hover:bg-muted/50 hover:border-primary transition-colors",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2d$plus$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__ImagePlus$3e$__["ImagePlus"], {
                                                    className: "w-8 h-8 mb-2"
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                    lineNumber: 176,
                                                    columnNumber: 33
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: t.addMoreImages
                                                }, void 0, false, {
                                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                                    lineNumber: 177,
                                                    columnNumber: 33
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                            lineNumber: 172,
                                            columnNumber: 28
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                    lineNumber: 155,
                                    columnNumber: 25
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                            lineNumber: 153,
                            columnNumber: 21
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                        lineNumber: 139,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                        type: "file",
                        ref: fileInputRef,
                        onChange: (e)=>handleFileSelect(e.target.files),
                        className: "hidden",
                        accept: "image/*",
                        multiple: true
                    }, void 0, false, {
                        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                        lineNumber: 184,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                lineNumber: 131,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                className: "flex-shrink-0 flex items-center justify-center gap-2 p-4 border-t bg-background",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "w-full max-w-lg flex gap-2 items-center",
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Button"], {
                        onClick: handleConvert,
                        size: "lg",
                        className: "flex-1 rounded-full h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90",
                        disabled: isConverting || files.length === 0,
                        children: [
                            isConverting ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$loader$2d$circle$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Loader2$3e$__["Loader2"], {
                                className: "animate-spin"
                            }, void 0, false, {
                                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                lineNumber: 203,
                                columnNumber: 25
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$image$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__default__as__Image$3e$__["Image"], {
                                className: "h-5 w-5"
                            }, void 0, false, {
                                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                lineNumber: 205,
                                columnNumber: 25
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "ml-2 sm:inline font-bold",
                                children: t.convertAndDownload
                            }, void 0, false, {
                                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                                lineNumber: 207,
                                columnNumber: 21
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                        lineNumber: 196,
                        columnNumber: 17
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                    lineNumber: 195,
                    columnNumber: 13
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
                lineNumber: 194,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx",
        lineNumber: 130,
        columnNumber: 5
    }, this);
}
_s(ImageToPdfPage, "dQQb7CADe2W9wo75iHBPuH4j5LY=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useToast"]
    ];
});
_c = ImageToPdfPage;
var _c;
__turbopack_context__.k.register(_c, "ImageToPdfPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/src/app/image-to-pdf/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>ImageToPdf)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$image$2d$to$2d$pdf$2f$components$2f$image$2d$to$2d$pdf$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/image-to-pdf/components/image-to-pdf-page.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/layouts/feature-page-layout.tsx [app-client] (ecmascript)");
"use client";
;
;
;
function ImageToPdf() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$layouts$2f$feature$2d$page$2d$layout$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FeaturePageLayout"], {
        title: "Image to PDF",
        showModelSelector: false,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$image$2d$to$2d$pdf$2f$components$2f$image$2d$to$2d$pdf$2d$page$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ImageToPdfPage"], {}, void 0, false, {
            fileName: "[project]/src/app/image-to-pdf/page.tsx",
            lineNumber: 10,
            columnNumber: 9
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/image-to-pdf/page.tsx",
        lineNumber: 9,
        columnNumber: 7
    }, this);
}
_c = ImageToPdf;
var _c;
__turbopack_context__.k.register(_c, "ImageToPdf");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
}]);

//# sourceMappingURL=src_a8663a60._.js.map