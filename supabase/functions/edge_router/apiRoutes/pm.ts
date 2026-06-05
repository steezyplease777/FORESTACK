import { type RequestContext,supabase } from "../utils.ts";
import { throwDatabaseError } from "../errors.ts";
import { type ProjectStyles } from "../typetypetype.ts";


function attachTrustedProjectStylesFields(data: ProjectStyles | ProjectStyles[], context: RequestContext): ProjectStyles | ProjectStyles[] {
    const { auth } = context;
    const companyId = auth.companyId;

        const withTrustedFields = (projectStyles: ProjectStyles): ProjectStyles => {
        const { user_id: _userId, company_id: _companyId, created_by: _createdBy, ...rest } =
            projectStyles as ProjectStyles & { user_id?: string };

        return {
            ...rest,
            created_by: auth.authUserId,
            company_id: companyId,
        } as ProjectStyles;
    };

    return Array.isArray(data)
        ? data.map(withTrustedFields)
        : withTrustedFields(data);
}

export const pmApi = {
    projectStyles: {
        create: async (requestData: unknown, context: RequestContext): Promise<ProjectStyles | ProjectStyles[]> => {
            const projectStyles = attachTrustedProjectStylesFields(requestData as ProjectStyles | ProjectStyles[], context);
            const { data, error } = await supabase
                .from("pm_project_styles")
                .insert(projectStyles)
                .select();

            if (error) {
                throw throwDatabaseError(error);
            }

            return data as ProjectStyles | ProjectStyles[];
        }
    }
};