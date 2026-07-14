export interface Project {
  name: string;
  description: string;
  technologies: string[];
}

export interface Experience {
  company: string;
  role: string;
  duration: string;
}

export interface ParsedResume {
  name: string;
  skills: string[];
  projects: Project[];
  experiences: Experience[];
}
