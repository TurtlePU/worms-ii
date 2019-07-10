declare interface Page {
    setup_html(): this;
    setup_socket(): this;
    validate(): Promise<this>;
    finalize(): Promise<this>;
}
