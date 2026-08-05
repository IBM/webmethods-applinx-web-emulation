import { HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NGXLoggerServerService } from "ngx-logger";

@Injectable()
export class AuthTokenServerService extends NGXLoggerServerService {

    protected override alterHttpRequest(httpRequest: HttpRequest<any>): HttpRequest<any> {
        // VULN-012: do NOT add the user's Bearer session token to remote log requests.
        // The log endpoint does not require user authentication — adding the token here
        // expands the credential attack surface to the log infrastructure.
        return httpRequest;
    }

}