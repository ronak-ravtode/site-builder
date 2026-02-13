import prisma from "../lib/prisma";
import openai from "../configs/openai";
// Make Revision
export const makeRevision = async (req, res) => {
    const userId = req.userId;
    try {
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { projectId } = req.params;
        const { message } = req.body;
        const user = await prisma.user.findUnique({
            where: {
                id: userId
            }
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.credits < 5) {
            return res.status(403).json({ message: 'Not enough credits' });
        }
        if (!message || message.trim() === '') {
            return res.status(400).json({ message: 'Invalid message' });
        }
        const currentProject = await prisma.websiteProject.findUnique({
            where: {
                id: projectId
            },
            include: {
                versions: true
            }
        });
        if (!currentProject) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma.conversation.create({
            data: {
                role: 'user',
                content: message,
                projectId: projectId
            }
        });
        await prisma.user.update({
            where: {
                id: userId
            },
            data: {
                credits: { decrement: 5 }
            }
        });
        // Enhance user Prompt
        const promptEnhanceResponse = await openai.chat.completions.create({
            model: 'arcee-ai/trinity-mini:free',
            messages: [
                {
                    role: 'system',
                    content: `You are a prompt enhancement specialist. The user wants to make changes to their website. Enhance their request to be more specific and actionable for a web developer.

                    Enhance this by:
                    1. Being specific about what elements to change
                    2. Mentioning design details (colors, spacing, sizes)
                    3. Clarifying the desired outcome
                    4. Using clear technical terms

                    Return ONLY the enhanced request, nothing else. Keep it concise (1-2 sentences).`
                },
                {
                    role: 'user',
                    content: `User's request: "${message}"`
                }
            ]
        });
        const enhancedPrompt = promptEnhanceResponse.choices[0].message.content;
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I have enhanced your prompt to: ${enhancedPrompt}`,
                projectId: projectId
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `Now making changes to your website...`,
                projectId: projectId
            }
        });
        // Generate website code
        const codeGenerationCode = await openai.chat.completions.create({
            model: 'arcee-ai/trinity-mini:free',
            messages: [
                {
                    role: 'system',
                    content: `You are an expert web developer. 

                    CRITICAL REQUIREMENTS:
                    - Return ONLY the complete updated HTML code with the requested changes.
                    - Use Tailwind CSS for ALL styling (NO custom CSS).
                    - Use Tailwind utility classes for all styling changes.
                    - Include all JavaScript in <script> tags before closing </body>
                    - Make sure it's a complete, standalone HTML document with Tailwind CSS
                    - Return the HTML Code Only, nothing else

                    Apply the requested changes while maintaining the Tailwind CSS styling approach.`
                },
                {
                    role: 'user',
                    content: `Here is the current website code: "${currentProject.current_code}" The user wants this change: "${enhancedPrompt}"`
                }
            ]
        });
        const code = codeGenerationCode.choices[0].message.content || '';
        if (!code) {
            await prisma.conversation.create({
                data: {
                    role: 'assistant',
                    content: `Unable to generate the code, please try again`,
                    projectId: projectId
                }
            });
            await prisma.user.update({
                where: { id: userId },
                data: {
                    credits: { increment: 5 }
                }
            });
            return;
        }
        const version = await prisma.version.create({
            data: {
                code: code.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim(),
                description: 'changes made',
                projectId: projectId
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I have made the changes to your website! You can now preview it`,
                projectId: projectId
            }
        });
        await prisma.websiteProject.update({
            where: {
                id: projectId
            },
            data: {
                current_code: code.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim(),
                current_version_index: version.id
            }
        });
        return res.status(200).json({
            message: 'Revision made successfully',
            code: code.replace(/```[a-z]*\n?/gi, '').replace(/```$/g, '').trim()
        });
    }
    catch (error) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                credits: { increment: 5 }
            }
        });
        console.log(error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};
// Rollback to a specific version
export const rollbackToVersion = async (req, res) => {
    try {
        const userId = req.userId;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const { projectId, versionId } = req.params;
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId
            },
            include: {
                versions: true
            }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        const version = project.versions.find((version) => version.id === versionId);
        if (!version) {
            return res.status(404).json({ message: 'Version not found' });
        }
        await prisma.websiteProject.update({
            where: { id: projectId, userId },
            data: {
                current_code: version.code,
                current_version_index: version.id
            }
        });
        await prisma.conversation.create({
            data: {
                role: 'assistant',
                content: `I have rolled back your website to selected version. You can now preview it`,
                projectId: projectId
            }
        });
        return res.status(200).json({ message: 'Version rolled back successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
// Delete a project
export const deleteProject = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        await prisma.websiteProject.delete({
            where: {
                id: projectId
            },
            include: {
                versions: true
            }
        });
        return res.status(200).json({ message: 'Project deleted successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
// Get project code for preview
export const getProjectPreview = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId
            },
            include: {
                versions: true
            }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        return res.status(200).json({ project });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
// Get published projects
export const getPublishedProjects = async (req, res) => {
    try {
        const projects = await prisma.websiteProject.findMany({
            where: {
                isPublished: true
            },
            include: {
                user: true
            }
        });
        return res.status(200).json({ projects });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
// Get a single project id
export const getProjectById = async (req, res) => {
    try {
        const { projectId } = req.params;
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId
            },
            include: {
                user: true
            }
        });
        if (!project || !project.isPublished || !project.current_code) {
            return res.status(404).json({ message: 'Project not found' });
        }
        return res.status(200).json({ code: project.current_code });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
// save project code
export const saveProjectCode = async (req, res) => {
    try {
        const userId = req.userId;
        const { projectId } = req.params;
        const { code } = req.body;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!code) {
            return res.status(400).json({ message: 'Code is required' });
        }
        const project = await prisma.websiteProject.findUnique({
            where: {
                id: projectId,
                userId
            }
        });
        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }
        await prisma.websiteProject.update({
            where: {
                id: projectId,
            },
            data: {
                current_code: code,
                current_version_index: ''
            }
        });
        return res.status(200).json({ message: 'Project saved successfully' });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: error.message });
    }
};
